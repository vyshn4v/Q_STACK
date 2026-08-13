import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface VoteResult {
  targetType: 'question' | 'answer';
  targetId: string;
  userVote: number | null; // 1, -1, or null if removed
  newScore: number;
  delta: number;
  authorId: string;
}

@Injectable()
export class VotesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findTargetAuthor(
    targetType: 'question' | 'answer',
    targetId: string,
  ): Promise<{ authorId: string; currentScore: number } | null> {
    const table = targetType === 'question' ? 'questions' : 'answers';
    const result = await this.db.query<{ author_id: string; score: number }>(
      `SELECT author_id, score FROM ${table} WHERE id = $1 AND status != 'soft_deleted'`,
      [targetId],
    );
    if (result.rows.length === 0) return null;
    return {
      authorId: result.rows[0].author_id,
      currentScore: result.rows[0].score,
    };
  }

  /**
   * Cast, switch, or remove vote following the exact scoring delta rules:
   * - Upvote from no prior: +1
   * - Downvote from no prior: -1
   * - Switch up to down: -2 (and down to up: +2)
   * - Toggling same vote: cancels vote (delta is -previous_value)
   */
  async castOrToggleVote(
    userId: string,
    targetType: 'question' | 'answer',
    targetId: string,
    requestedValue: 1 | -1,
  ): Promise<VoteResult> {
    return this.db.transaction(async (client) => {
      const table = targetType === 'question' ? 'questions' : 'answers';

      // 1. Get author and current score
      const targetResult = await client.query<{ author_id: string; score: number }>(
        `SELECT author_id, score FROM ${table} WHERE id = $1 FOR UPDATE`,
        [targetId],
      );
      if (targetResult.rows.length === 0) {
        throw new Error('Target post not found.');
      }
      const { author_id: authorId } = targetResult.rows[0];

      // 2. Check existing vote
      const existingVoteResult = await client.query<{ id: string; value: number }>(
        `SELECT id, value FROM votes WHERE target_type = $1 AND target_id = $2 AND user_id = $3`,
        [targetType, targetId, userId],
      );

      let delta = 0;
      let finalUserVote: number | null = null;

      if (existingVoteResult.rows.length > 0) {
        const existingValue = existingVoteResult.rows[0].value;

        if (existingValue === requestedValue) {
          // Toggle off (remove vote)
          await client.query(
            `DELETE FROM votes WHERE target_type = $1 AND target_id = $2 AND user_id = $3`,
            [targetType, targetId, userId],
          );
          delta = -existingValue;
          finalUserVote = null;
        } else {
          // Switch vote (e.g. +1 to -1 => delta = -2)
          await client.query(
            `UPDATE votes SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE target_type = $2 AND target_id = $3 AND user_id = $4`,
            [requestedValue, targetType, targetId, userId],
          );
          delta = requestedValue - existingValue;
          finalUserVote = requestedValue;
        }
      } else {
        // New vote
        await client.query(
          `INSERT INTO votes (target_type, target_id, user_id, value) VALUES ($1, $2, $3, $4)`,
          [targetType, targetId, userId, requestedValue],
        );
        delta = requestedValue;
        finalUserVote = requestedValue;
      }

      // 3. Update cached score on target post
      const updatedScoreResult = await client.query<{ score: number }>(
        `UPDATE ${table} SET score = score + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING score`,
        [delta, targetId],
      );
      const newScore = updatedScoreResult.rows[0].score;

      return {
        targetType,
        targetId,
        userVote: finalUserVote,
        newScore,
        delta,
        authorId,
      };
    });
  }
}
