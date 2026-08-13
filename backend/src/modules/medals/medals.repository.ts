import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface MedalRecord {
  id: string;
  question_id: string;
  given_by_user_id: string;
  tier: 'gold' | 'silver' | 'bronze';
  given_at: Date;
  giver_name?: string;
}

export interface QuestionMedalsSummary {
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  userMedal: 'gold' | 'silver' | 'bronze' | null;
}

@Injectable()
export class MedalsRepository {
  constructor(private readonly db: DatabaseService) {}

  async giveOrUpdateMedal(
    questionId: string,
    userId: string,
    tier: 'gold' | 'silver' | 'bronze',
  ): Promise<MedalRecord> {
    const query = `
      INSERT INTO medals (question_id, given_by_user_id, tier, given_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (question_id, given_by_user_id)
      DO UPDATE SET tier = EXCLUDED.tier, given_at = CURRENT_TIMESTAMP
      RETURNING id, question_id, given_by_user_id, tier, given_at;
    `;
    const result = await this.db.query<MedalRecord>(query, [questionId, userId, tier]);
    return result.rows[0];
  }

  async removeMedal(questionId: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM medals
      WHERE question_id = $1 AND given_by_user_id = $2;
    `;
    const result = await this.db.query(query, [questionId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  async getQuestionMedalsSummary(questionId: string, userId?: string): Promise<QuestionMedalsSummary> {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE tier = 'gold') AS gold_count,
        COUNT(*) FILTER (WHERE tier = 'silver') AS silver_count,
        COUNT(*) FILTER (WHERE tier = 'bronze') AS bronze_count,
        COUNT(*) AS total_count,
        MAX(CASE WHEN given_by_user_id = $2 THEN tier ELSE NULL END) AS user_medal
      FROM medals
      WHERE question_id = $1;
    `;
    const result = await this.db.query<{
      gold_count: string;
      silver_count: string;
      bronze_count: string;
      total_count: string;
      user_medal: 'gold' | 'silver' | 'bronze' | null;
    }>(query, [questionId, userId || null]);

    const row = result.rows[0];
    return {
      gold: parseInt(row?.gold_count || '0', 10),
      silver: parseInt(row?.silver_count || '0', 10),
      bronze: parseInt(row?.bronze_count || '0', 10),
      total: parseInt(row?.total_count || '0', 10),
      userMedal: row?.user_medal || null,
    };
  }

  async getQuestionAuthorId(questionId: string): Promise<string | null> {
    const query = `SELECT author_id FROM questions WHERE id = $1;`;
    const result = await this.db.query<{ author_id: string }>(query, [questionId]);
    return result.rows[0]?.author_id || null;
  }
}
