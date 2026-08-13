import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface BookmarkedQuestionRow {
  id: string;
  author_id: string;
  title: string;
  body: string;
  status: string;
  views_count: number;
  score: number;
  answers_count: number;
  created_at: Date;
  updated_at: Date;
  author_name: string;
  author_avatar: string | null;
  author_reputation: number;
  bookmarked_at: Date;
  tags: { id: string; name: string }[];
  medals_count: number;
  has_accepted_answer: boolean;
}

@Injectable()
export class BookmarksRepository {
  constructor(private readonly db: DatabaseService) {}

  async isBookmarked(userId: string, questionId: string): Promise<boolean> {
    const query = `
      SELECT id FROM bookmarks
      WHERE user_id = $1 AND question_id = $2;
    `;
    const result = await this.db.query(query, [userId, questionId]);
    return result.rows.length > 0;
  }

  async addBookmark(userId: string, questionId: string): Promise<void> {
    const query = `
      INSERT INTO bookmarks (user_id, question_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, question_id) DO NOTHING;
    `;
    await this.db.query(query, [userId, questionId]);
  }

  async removeBookmark(userId: string, questionId: string): Promise<boolean> {
    const query = `
      DELETE FROM bookmarks
      WHERE user_id = $1 AND question_id = $2;
    `;
    const result = await this.db.query(query, [userId, questionId]);
    return (result.rowCount ?? 0) > 0;
  }

  async getUserBookmarks(userId: string, page = 1, limit = 20): Promise<{ questions: BookmarkedQuestionRow[]; total: number }> {
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) as total FROM bookmarks WHERE user_id = $1;`;
    const countResult = await this.db.query<{ total: string }>(countQuery, [userId]);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    const query = `
      SELECT
        q.id,
        q.author_id,
        q.title,
        q.body,
        q.status,
        q.views_count,
        q.score,
        q.answers_count,
        q.created_at,
        q.updated_at,
        u.display_name AS author_name,
        u.avatar_url AS author_avatar,
        u.reputation_total AS author_reputation,
        b.created_at AS bookmarked_at,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::json
        ) AS tags,
        COALESCE(
          (SELECT COUNT(*) FROM medals m WHERE m.question_id = q.id),
          0
        )::int AS medals_count,
        EXISTS (
          SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_accepted = true
        ) AS has_accepted_answer
      FROM bookmarks b
      JOIN questions q ON q.id = b.question_id
      JOIN users u ON u.id = q.author_id
      LEFT JOIN question_tags qt ON qt.question_id = q.id
      LEFT JOIN tags t ON t.id = qt.tag_id
      WHERE b.user_id = $1
      GROUP BY q.id, u.id, b.created_at
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await this.db.query<BookmarkedQuestionRow>(query, [userId, limit, offset]);
    return {
      questions: result.rows,
      total,
    };
  }
}
