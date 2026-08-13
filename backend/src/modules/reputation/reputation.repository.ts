import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DEFAULT_SYSTEM_BADGES } from './reputation.config';

export interface CronRunRow {
  id: string;
  job_name: string;
  started_at: Date;
  completed_at: Date | null;
  status: 'running' | 'completed' | 'failed';
  events_processed: number;
  metadata: Record<string, any>;
}

export interface ActivityEventRow {
  id: string;
  event_type: string;
  user_id: string | null;
  payload: Record<string, any>;
  created_at: Date;
}

export interface ReputationLedgerRow {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  source_event_id: string | null;
  created_at: Date;
}

export interface UserStatsRow {
  id: string;
  display_name: string;
  role: string;
  reputation_total: number;
  questions_count: number;
  accepted_answers_count: number;
  medals_received_count: number;
  daily_logins_count: number;
}

@Injectable()
export class ReputationRepository {
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureBadgeRules();
  }

  async ensureBadgeRules(): Promise<void> {
    for (const rule of DEFAULT_SYSTEM_BADGES) {
      await this.db.query(
        `INSERT INTO badge_rules (name, tier, criteria_type, threshold, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO UPDATE
         SET tier = EXCLUDED.tier,
             criteria_type = EXCLUDED.criteria_type,
             threshold = EXCLUDED.threshold,
             description = EXCLUDED.description`,
        [rule.name, rule.tier, rule.criteriaType, rule.threshold, rule.description],
      );
    }
  }

  async getLastSuccessfulRun(jobName = 'nightly_reputation_badges'): Promise<Date | null> {
    const result = await this.db.query<{ started_at: Date }>(
      `SELECT started_at FROM cron_runs
       WHERE job_name = $1 AND status = 'completed'
       ORDER BY started_at DESC
       LIMIT 1`,
      [jobName],
    );
    return result.rows[0]?.started_at || null;
  }

  async startCronRun(jobName = 'nightly_reputation_badges'): Promise<string> {
    const result = await this.db.query<{ id: string }>(
      `INSERT INTO cron_runs (job_name, status, started_at, metadata)
       VALUES ($1, 'running', CURRENT_TIMESTAMP, '{}'::jsonb)
       RETURNING id`,
      [jobName],
    );
    return result.rows[0].id;
  }

  async completeCronRun(
    runId: string,
    eventsProcessed: number,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    await this.db.query(
      `UPDATE cron_runs
       SET status = 'completed',
           completed_at = CURRENT_TIMESTAMP,
           events_processed = $2,
           metadata = $3
       WHERE id = $1`,
      [runId, eventsProcessed, JSON.stringify(metadata)],
    );
  }

  async failCronRun(runId: string, errorMessage: string): Promise<void> {
    await this.db.query(
      `UPDATE cron_runs
       SET status = 'failed',
           completed_at = CURRENT_TIMESTAMP,
           metadata = jsonb_build_object('error', $2::text)
       WHERE id = $1`,
      [runId, errorMessage],
    );
  }

  async getUnprocessedActivityEvents(sinceTimestamp: Date | null): Promise<ActivityEventRow[]> {
    if (!sinceTimestamp) {
      const result = await this.db.query<ActivityEventRow>(
        `SELECT id, event_type, user_id, payload, created_at
         FROM activity_events
         ORDER BY created_at ASC`,
      );
      return result.rows;
    }

    const result = await this.db.query<ActivityEventRow>(
      `SELECT id, event_type, user_id, payload, created_at
       FROM activity_events
       WHERE created_at > $1
       ORDER BY created_at ASC`,
      [sinceTimestamp],
    );
    return result.rows;
  }

  async insertLedgerEntry(
    userId: string,
    delta: number,
    reason: string,
    sourceEventId?: string,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO reputation_ledger (user_id, delta, reason, source_event_id, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [userId, delta, reason, sourceEventId || null],
    );
  }

  async updateUserReputationTotal(userId: string): Promise<number> {
    const result = await this.db.query<{ total: number }>(
      `UPDATE users
       SET reputation_total = GREATEST(0, (
         SELECT COALESCE(SUM(delta), 0)::int
         FROM reputation_ledger
         WHERE user_id = $1
       )),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING reputation_total AS total`,
      [userId],
    );
    return result.rows[0]?.total || 0;
  }

  async getAllUsersStats(): Promise<UserStatsRow[]> {
    const query = `
      SELECT
        u.id,
        u.display_name,
        u.role,
        u.reputation_total,
        (SELECT COUNT(*) FROM questions q WHERE q.author_id = u.id AND q.status != 'soft_deleted')::int AS questions_count,
        (SELECT COUNT(*) FROM answers a WHERE a.author_id = u.id AND a.is_accepted = TRUE AND a.status != 'soft_deleted')::int AS accepted_answers_count,
        (
          SELECT COUNT(*)
          FROM medals m
          JOIN questions q ON m.question_id = q.id
          WHERE q.author_id = u.id
        )::int AS medals_received_count,
        (SELECT COUNT(*) FROM daily_active da WHERE da.user_id = u.id)::int AS daily_logins_count
      FROM users u
      WHERE u.is_banned = FALSE;
    `;
    const result = await this.db.query<UserStatsRow>(query);
    return result.rows;
  }

  async getUserEarnedBadgeNames(userId: string): Promise<string[]> {
    const result = await this.db.query<{ name: string }>(
      `SELECT name FROM badges WHERE user_id = $1`,
      [userId],
    );
    return result.rows.map((r) => r.name);
  }

  async awardBadge(userId: string, name: string, tier: string): Promise<boolean> {
    const result = await this.db.query(
      `INSERT INTO badges (user_id, name, tier, awarded_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, name) DO NOTHING
       RETURNING id`,
      [userId, name, tier],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async promoteUserToModerator(userId: string): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE users
       SET role = 'moderator', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'user'`,
      [userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getUserReputationHistory(userId: string, limit = 50): Promise<ReputationLedgerRow[]> {
    const result = await this.db.query<ReputationLedgerRow>(
      `SELECT id, user_id, delta, reason, source_event_id, created_at
       FROM reputation_ledger
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  async getRecentCronRuns(limit = 20): Promise<CronRunRow[]> {
    const result = await this.db.query<CronRunRow>(
      `SELECT id, job_name, started_at, completed_at, status, events_processed, metadata
       FROM cron_runs
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  async getBadgeCatalog() {
    const result = await this.db.query(
      `SELECT id, name, tier, criteria_type, threshold, description
       FROM badge_rules
       ORDER BY threshold ASC, name ASC`,
    );
    return result.rows;
  }

  async getQuestionAuthorId(questionId: string): Promise<string | null> {
    const result = await this.db.query<{ author_id: string }>(
      `SELECT author_id FROM questions WHERE id = $1`,
      [questionId],
    );
    return result.rows[0]?.author_id || null;
  }

  async getAnswerAuthorId(answerId: string): Promise<string | null> {
    const result = await this.db.query<{ author_id: string }>(
      `SELECT author_id FROM answers WHERE id = $1`,
      [answerId],
    );
    return result.rows[0]?.author_id || null;
  }
}
