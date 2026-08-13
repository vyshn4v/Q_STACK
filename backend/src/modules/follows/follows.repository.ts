import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface FollowRecord {
  id: string;
  follower_id: string;
  target_type: 'user' | 'tag' | 'question';
  target_id: string;
  created_at: Date;
}

@Injectable()
export class FollowsRepository {
  constructor(private readonly db: DatabaseService) {}

  async isFollowing(
    followerId: string,
    targetType: 'user' | 'tag' | 'question',
    targetId: string,
  ): Promise<boolean> {
    const query = `
      SELECT id FROM follows
      WHERE follower_id = $1 AND target_type = $2 AND target_id = $3;
    `;
    const result = await this.db.query(query, [followerId, targetType, targetId]);
    return result.rows.length > 0;
  }

  async follow(
    followerId: string,
    targetType: 'user' | 'tag' | 'question',
    targetId: string,
  ): Promise<FollowRecord> {
    const query = `
      INSERT INTO follows (follower_id, target_type, target_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (follower_id, target_type, target_id) DO NOTHING
      RETURNING id, follower_id, target_type, target_id, created_at;
    `;
    const result = await this.db.query<FollowRecord>(query, [followerId, targetType, targetId]);
    return result.rows[0];
  }

  async unfollow(
    followerId: string,
    targetType: 'user' | 'tag' | 'question',
    targetId: string,
  ): Promise<boolean> {
    const query = `
      DELETE FROM follows
      WHERE follower_id = $1 AND target_type = $2 AND target_id = $3;
    `;
    const result = await this.db.query(query, [followerId, targetType, targetId]);
    return (result.rowCount ?? 0) > 0;
  }

  async getFollowingUsers(userId: string) {
    const query = `
      SELECT u.id, u.display_name, u.avatar_url, u.reputation_total, f.created_at as followed_at
      FROM follows f
      JOIN users u ON u.id = f.target_id
      WHERE f.follower_id = $1 AND f.target_type = 'user'
      ORDER BY f.created_at DESC;
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async getFollowingTags(userId: string) {
    const query = `
      SELECT t.id, t.name, t.description, t.questions_count, f.created_at as followed_at
      FROM follows f
      JOIN tags t ON t.id = f.target_id
      WHERE f.follower_id = $1 AND f.target_type = 'tag'
      ORDER BY f.created_at DESC;
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }
}
