import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface CommentItem {
  id: string;
  parent_type: 'question' | 'answer';
  parent_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_reputation: number;
  body: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class CommentsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByParent(
    parentType: 'question' | 'answer',
    parentId: string,
  ): Promise<CommentItem[]> {
    const query = `
      SELECT
        c.id,
        c.parent_type,
        c.parent_id,
        c.author_id,
        u.display_name AS author_name,
        u.avatar_url AS author_avatar,
        u.reputation_total AS author_reputation,
        c.body,
        c.status,
        c.created_at,
        c.updated_at
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.parent_type = $1 AND c.parent_id = $2 AND c.status != 'soft_deleted'
      ORDER BY c.created_at ASC
    `;
    const result = await this.db.query<CommentItem>(query, [parentType, parentId]);
    return result.rows;
  }

  async findById(id: string): Promise<CommentItem | null> {
    const query = `
      SELECT
        c.id,
        c.parent_type,
        c.parent_id,
        c.author_id,
        u.display_name AS author_name,
        u.avatar_url AS author_avatar,
        u.reputation_total AS author_reputation,
        c.body,
        c.status,
        c.created_at,
        c.updated_at
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = $1 AND c.status != 'soft_deleted'
    `;
    const result = await this.db.query<CommentItem>(query, [id]);
    return result.rows[0] || null;
  }

  async create(
    parentType: 'question' | 'answer',
    parentId: string,
    authorId: string,
    body: string,
  ): Promise<CommentItem> {
    const insertResult = await this.db.query<CommentItem>(
      `INSERT INTO comments (parent_type, parent_id, author_id, body, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, parent_type, parent_id, author_id, body, status, created_at, updated_at`,
      [parentType, parentId, authorId, body.trim()],
    );
    const comment = insertResult.rows[0];

    const author = await this.db.query(
      'SELECT display_name, avatar_url, reputation_total FROM users WHERE id = $1',
      [authorId],
    );

    return {
      ...comment,
      author_name: author.rows[0]?.display_name || '',
      author_avatar: author.rows[0]?.avatar_url || null,
      author_reputation: author.rows[0]?.reputation_total || 0,
    };
  }

  async update(id: string, body: string): Promise<void> {
    await this.db.query(
      'UPDATE comments SET body = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [body.trim(), id],
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      "UPDATE comments SET status = 'soft_deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id],
    );
  }
}
