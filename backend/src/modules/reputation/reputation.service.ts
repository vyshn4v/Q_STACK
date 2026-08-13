import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReputationRepository } from './reputation.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { REPUTATION_SCORING_CONFIG, DEFAULT_SYSTEM_BADGES } from './reputation.config';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private readonly repo: ReputationRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Nightly 1:00 AM Cron Job (UTC)
   */
  @Cron('0 1 * * *')
  async handleNightlyCron() {
    this.logger.log('Starting 1:00 AM Nightly Reputation & Badges Job...');
    return this.runReputationCalculationJob('nightly_reputation_badges');
  }

  /**
   * Run the complete reputation & badges calculation pipeline
   */
  async runReputationCalculationJob(jobName = 'nightly_reputation_badges') {
    const runId = await this.repo.startCronRun(jobName);
    const affectedUserIds = new Set<string>();
    let eventsProcessedCount = 0;
    let badgesAwardedCount = 0;
    let promotionsCount = 0;

    try {
      // Step 1: Find timestamp of last successful run
      const lastRunTime = await this.repo.getLastSuccessfulRun(jobName);
      this.logger.log(`Processing events since last successful run: ${lastRunTime ? lastRunTime.toISOString() : 'beginning of time'}`);

      // Step 2: Fetch unprocessed activity events
      const events = await this.repo.getUnprocessedActivityEvents(lastRunTime);
      eventsProcessedCount = events.length;

      // Step 3: Process reputation deltas
      for (const event of events) {
        const payload = event.payload || {};

        if (event.event_type === 'vote.cast') {
          const targetType = payload.targetType;
          const targetId = payload.targetId;
          const value = payload.value; // 1 or -1

          if (targetType === 'question') {
            const authorId = await this.repo.getQuestionAuthorId(targetId);
            if (authorId && authorId !== event.user_id) {
              const delta = value === 1
                ? REPUTATION_SCORING_CONFIG.questionUpvoteReceived
                : REPUTATION_SCORING_CONFIG.questionDownvoteReceived;
              const reason = value === 1 ? 'Question received upvote' : 'Question received downvote';
              await this.repo.insertLedgerEntry(authorId, delta, reason, event.id);
              affectedUserIds.add(authorId);
            }
          } else if (targetType === 'answer') {
            const authorId = await this.repo.getAnswerAuthorId(targetId);
            if (authorId && authorId !== event.user_id) {
              const delta = value === 1
                ? REPUTATION_SCORING_CONFIG.answerUpvoteReceived
                : REPUTATION_SCORING_CONFIG.answerDownvoteReceived;
              const reason = value === 1 ? 'Answer received upvote' : 'Answer received downvote';
              await this.repo.insertLedgerEntry(authorId, delta, reason, event.id);
              affectedUserIds.add(authorId);
            }
          }
        } else if (event.event_type === 'answer.accepted') {
          const answerAuthorId = payload.answerAuthorId;
          if (answerAuthorId) {
            await this.repo.insertLedgerEntry(
              answerAuthorId,
              REPUTATION_SCORING_CONFIG.answerAcceptedReceived,
              'Answer accepted by question author',
              event.id,
            );
            affectedUserIds.add(answerAuthorId);
          }
        } else if (event.event_type === 'medal.given') {
          const authorId = payload.questionAuthorId;
          const tier = payload.tier;
          if (authorId) {
            let delta = REPUTATION_SCORING_CONFIG.medalBronzeReceived;
            if (tier === 'silver') delta = REPUTATION_SCORING_CONFIG.medalSilverReceived;
            if (tier === 'gold') delta = REPUTATION_SCORING_CONFIG.medalGoldReceived;

            await this.repo.insertLedgerEntry(
              authorId,
              delta,
              `Received ${tier} medal for question quality`,
              event.id,
            );
            affectedUserIds.add(authorId);
          }
        } else if (event.event_type === 'user.login' && event.user_id) {
          await this.repo.insertLedgerEntry(
            event.user_id,
            REPUTATION_SCORING_CONFIG.dailyLogin,
            'Daily platform activity streak',
            event.id,
          );
          affectedUserIds.add(event.user_id);
        }
      }

      // Step 4: Update total reputation for all affected users
      for (const userId of affectedUserIds) {
        await this.repo.updateUserReputationTotal(userId);
      }

      // Step 5: Evaluate badge rules
      const allUsersStats = await this.repo.getAllUsersStats();

      for (const user of allUsersStats) {
        const earnedBadgeNames = await this.repo.getUserEarnedBadgeNames(user.id);

        for (const rule of DEFAULT_SYSTEM_BADGES) {
          if (earnedBadgeNames.includes(rule.name)) {
            continue; // Already earned
          }

          let qualified = false;
          if (rule.criteriaType === 'questions_asked' && user.questions_count >= rule.threshold) {
            qualified = true;
          } else if (rule.criteriaType === 'accepted_answers' && user.accepted_answers_count >= rule.threshold) {
            qualified = true;
          } else if (rule.criteriaType === 'medals_received' && user.medals_received_count >= rule.threshold) {
            qualified = true;
          } else if (rule.criteriaType === 'daily_logins' && user.daily_logins_count >= rule.threshold) {
            qualified = true;
          }

          if (qualified) {
            const awarded = await this.repo.awardBadge(user.id, rule.name, rule.tier);
            if (awarded) {
              badgesAwardedCount++;
              // Notify user in real-time
              await this.notificationsService.createNotification(user.id, 'badge.awarded', {
                message: `Congratulations! You earned the "${rule.name}" (${rule.tier.toUpperCase()}) badge!`,
                badgeName: rule.name,
                tier: rule.tier,
              });
            }
          }
        }

        // Step 6: Evaluate Moderator Auto-Promotion (Threshold >= 500 rep)
        if (
          user.role === 'user' &&
          user.reputation_total >= REPUTATION_SCORING_CONFIG.moderatorAutoPromotionThreshold
        ) {
          const promoted = await this.repo.promoteUserToModerator(user.id);
          if (promoted) {
            promotionsCount++;
            this.logger.log(`Auto-promoted user ${user.display_name} (${user.id}) to MODERATOR (Reputation: ${user.reputation_total})`);
            await this.notificationsService.createNotification(user.id, 'role.promoted', {
              message: `You have been automatically promoted to Moderator for your exceptional technical contributions!`,
              newRole: 'moderator',
            });
          }
        }
      }

      // Step 7: Record completed run
      const metadata = {
        eventsProcessed: eventsProcessedCount,
        usersUpdated: affectedUserIds.size,
        badgesAwarded: badgesAwardedCount,
        moderatorPromotions: promotionsCount,
        completedAt: new Date().toISOString(),
      };

      await this.repo.completeCronRun(runId, eventsProcessedCount, metadata);

      this.logger.log(`Reputation calculation completed successfully. Processed: ${eventsProcessedCount} events, Updated: ${affectedUserIds.size} users, Awarded: ${badgesAwardedCount} badges, Promoted: ${promotionsCount} moderators.`);

      return {
        runId,
        status: 'completed',
        ...metadata,
      };
    } catch (err: any) {
      this.logger.error(`Reputation calculation failed: ${err.message}`, err.stack);
      await this.repo.failCronRun(runId, err.message);
      throw err;
    }
  }

  async getUserReputationHistory(userId: string, limit = 50) {
    return this.repo.getUserReputationHistory(userId, limit);
  }

  async getBadgeCatalog() {
    return this.repo.getBadgeCatalog();
  }

  async getCronRuns(limit = 20) {
    return this.repo.getRecentCronRuns(limit);
  }
}
