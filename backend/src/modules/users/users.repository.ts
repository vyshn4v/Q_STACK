import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  reputation_total: number;
  questions_count: number;
  answers_count: number;
  medals_received_count: number;
  badges: { name: string; tier: string; awarded_at: Date }[];
  created_at: Date;
}

export interface UserQuestionRow {
  id: string;
  title: string;
  views_count: number;
  score: number;
  answers_count: number;
  created_at: Date;
  tags: { id: string; name: string }[];
  has_accepted_answer: boolean;
}

export interface UserAnswerRow {
  id: string;
  question_id: string;
  question_title: string;
  body: string;
  score: number;
  is_accepted: boolean;
  created_at: Date;
}

export interface UserActivityRow {
  id: string;
  event_type: string;
  payload: Record<string, any>;
  created_at: Date;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<UserProfile | null> {
    const query = `
      SELECT
        u.id,
        u.email,
        u.display_name,
        u.avatar_url,
        u.bio,
        u.role,
        u.reputation_total,
        u.created_at,
        (SELECT COUNT(*) FROM questions q WHERE q.author_id = u.id AND q.status != 'soft_deleted')::int AS questions_count,
        (SELECT COUNT(*) FROM answers a WHERE a.author_id = u.id AND a.status != 'soft_deleted')::int AS answers_count,
        (
          SELECT COUNT(*)
          FROM medals m
          JOIN questions q ON m.question_id = q.id
          WHERE q.author_id = u.id
        )::int AS medals_received_count,
        COALESCE(
          (
            SELECT json_agg(json_build_object('name', b.name, 'tier', b.tier, 'awarded_at', b.awarded_at))
            FROM badges b
            WHERE b.user_id = u.id
          ),
          '[]'::json
        ) AS badges
      FROM users u
      WHERE u.id = $1 AND u.is_banned = FALSE
    `;
    const result = await this.db.query<UserProfile>(query, [id]);
    return result.rows[0] || null;
  }

  async findLeaderboard(limit = 20): Promise<UserProfile[]> {
    const query = `
      SELECT
        u.id,
        u.email,
        u.display_name,
        u.avatar_url,
        u.bio,
        u.role,
        u.reputation_total,
        u.created_at,
        (SELECT COUNT(*) FROM questions q WHERE q.author_id = u.id AND q.status != 'soft_deleted')::int AS questions_count,
        (SELECT COUNT(*) FROM answers a WHERE a.author_id = u.id AND a.status != 'soft_deleted')::int AS answers_count,
        0 AS medals_received_count,
        '[]'::json AS badges
      FROM users u
      WHERE u.is_banned = FALSE
      ORDER BY u.reputation_total DESC, u.created_at ASC
      LIMIT $1
    `;
    const result = await this.db.query<UserProfile>(query, [limit]);
    return result.rows;
  }

  async getUserQuestions(userId: string, limit = 20): Promise<UserQuestionRow[]> {
    const query = `
      SELECT
        q.id,
        q.title,
        q.views_count,
        q.score,
        q.answers_count,
        q.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::json
        ) AS tags,
        EXISTS (
          SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_accepted = true
        ) AS has_accepted_answer
      FROM questions q
      LEFT JOIN question_tags qt ON qt.question_id = q.id
      LEFT JOIN tags t ON t.id = qt.tag_id
      WHERE q.author_id = $1 AND q.status != 'soft_deleted'
      GROUP BY q.id
      ORDER BY q.created_at DESC
      LIMIT $2;
    `;
    const result = await this.db.query<UserQuestionRow>(query, [userId, limit]);
    return result.rows;
  }

  async getUserAnswers(userId: string, limit = 20): Promise<UserAnswerRow[]> {
    const query = `
      SELECT
        a.id,
        a.question_id,
        q.title AS question_title,
        a.body,
        a.score,
        a.is_accepted,
        a.created_at
      FROM answers a
      JOIN questions q ON q.id = a.question_id
      WHERE a.author_id = $1 AND a.status != 'soft_deleted'
      ORDER BY a.created_at DESC
      LIMIT $2;
    `;
    const result = await this.db.query<UserAnswerRow>(query, [userId, limit]);
    return result.rows;
  }

  async getUserActivity(userId: string, limit = 30): Promise<UserActivityRow[]> {
    const query = `
      SELECT id, event_type, payload, created_at
      FROM activity_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const result = await this.db.query<UserActivityRow>(query, [userId, limit]);
    return result.rows;
  }

  async updateProfile(
    id: string,
    displayName?: string,
    bio?: string,
    avatarUrl?: string,
  ): Promise<void> {
    const setParts: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [id];

    if (displayName) {
      values.push(displayName.trim());
      setParts.push(`display_name = $${values.length}`);
    }
    if (bio !== undefined) {
      values.push(bio ? bio.trim() : null);
      setParts.push(`bio = $${values.length}`);
    }
    if (avatarUrl !== undefined) {
      values.push(avatarUrl ? avatarUrl.trim() : null);
      setParts.push(`avatar_url = $${values.length}`);
    }

    await this.db.query(
      `UPDATE users SET ${setParts.join(', ')} WHERE id = $1`,
      values,
    );
  }
}
