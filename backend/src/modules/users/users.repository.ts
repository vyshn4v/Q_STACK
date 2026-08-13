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
