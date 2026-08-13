import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface AnswerItem {
  id: string;
  question_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_reputation: number;
  body: string;
  is_accepted: boolean;
  score: number;
  status: string;
  user_vote?: number | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AnswersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByQuestionId(
    questionId: string,
    currentUserId?: string,
  ): Promise<AnswerItem[]> {
    const values: any[] = [questionId];
    let userVoteSelect = 'NULL::smallint AS user_vote';

    if (currentUserId) {
      values.push(currentUserId);
      userVoteSelect = `(SELECT v.value FROM votes v WHERE v.target_type = 'answer' AND v.target_id = a.id AND v.user_id = $2) AS user_vote`;
    }

    const query = `
      SELECT
        a.id,
        a.question_id,
        a.author_id,
        u.display_name AS author_name,
        u.avatar_url AS author_avatar,
        u.reputation_total AS author_reputation,
        a.body,
        a.is_accepted,
        a.score,
        a.status,
        a.created_at,
        a.updated_at,
        ${userVoteSelect}
      FROM answers a
      JOIN users u ON a.author_id = u.id
      WHERE a.question_id = $1 AND a.status != 'soft_deleted'
      ORDER BY a.is_accepted DESC, a.score DESC, a.created_at ASC
    `;

    const result = await this.db.query<AnswerItem>(query, values);
    return result.rows;
  }

  async findById(id: string): Promise<AnswerItem | null> {
    const query = `
      SELECT
        a.id,
        a.question_id,
        a.author_id,
        u.display_name AS author_name,
        u.avatar_url AS author_avatar,
        u.reputation_total AS author_reputation,
        a.body,
        a.is_accepted,
        a.score,
        a.status,
        a.created_at,
        a.updated_at
      FROM answers a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = $1 AND a.status != 'soft_deleted'
    `;
    const result = await this.db.query<AnswerItem>(query, [id]);
    return result.rows[0] || null;
  }

  async create(
    questionId: string,
    authorId: string,
    body: string,
  ): Promise<AnswerItem> {
    return this.db.transaction(async (client) => {
      const insertResult = await client.query<AnswerItem>(
        `INSERT INTO answers (question_id, author_id, body, is_accepted, score, status)
         VALUES ($1, $2, $3, FALSE, 0, 'active')
         RETURNING id, question_id, author_id, body, is_accepted, score, status, created_at, updated_at`,
        [questionId, authorId, body.trim()],
      );
      const answer = insertResult.rows[0];

      // Increment answers_count on question
      await client.query(
        'UPDATE questions SET answers_count = answers_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [questionId],
      );

      const author = await client.query(
        'SELECT display_name, avatar_url, reputation_total FROM users WHERE id = $1',
        [authorId],
      );

      return {
        ...answer,
        author_name: author.rows[0]?.display_name || '',
        author_avatar: author.rows[0]?.avatar_url || null,
        author_reputation: author.rows[0]?.reputation_total || 0,
        user_vote: null,
      };
    });
  }

  async acceptAnswer(
    answerId: string,
    questionId: string,
  ): Promise<void> {
    await this.db.transaction(async (client) => {
      // Unset previous accepted answer if any
      await client.query(
        'UPDATE answers SET is_accepted = FALSE WHERE question_id = $1 AND is_accepted = TRUE',
        [questionId],
      );

      // Set this answer as accepted
      await client.query(
        'UPDATE answers SET is_accepted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [answerId],
      );
    });
  }

  async update(id: string, body: string): Promise<void> {
    await this.db.query(
      'UPDATE answers SET body = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [body.trim(), id],
    );
  }

  async softDelete(id: string, questionId: string): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query(
        "UPDATE answers SET status = 'soft_deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id],
      );
      await client.query(
        'UPDATE questions SET answers_count = GREATEST(0, answers_count - 1), updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [questionId],
      );
    });
  }
}
