import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TagsRepository } from '../tags/tags.repository';

export interface QuestionListItem {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_reputation: number;
  title: string;
  body: string;
  status: string;
  views_count: number;
  score: number;
  answers_count: number;
  tags: { id: string; name: string }[];
  medals_count: number;
  has_accepted_answer: boolean;
  user_vote?: number | null;
  is_bookmarked?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionDetail extends QuestionListItem {
  ai_response?: {
    status: string;
    response_text: string | null;
    model: string | null;
  } | null;
}

@Injectable()
export class QuestionsRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly tagsRepo: TagsRepository,
  ) {}

  async findAll(params: {
    tag?: string;
    sort?: string;
    search?: string;
    page: number;
    limit: number;
    currentUserId?: string;
  }): Promise<{ questions: QuestionListItem[]; total: number }> {
    const offset = (params.page - 1) * params.limit;
    const values: any[] = [];
    const whereClauses: string[] = ["q.status != 'soft_deleted'"];

    if (params.search) {
      values.push(`%${params.search}%`);
      whereClauses.push(`(q.title ILIKE $${values.length} OR q.body ILIKE $${values.length})`);
    }

    if (params.tag) {
      values.push(params.tag.toLowerCase().trim());
      whereClauses.push(`
        EXISTS (
          SELECT 1 FROM question_tags qt
          JOIN tags t ON qt.tag_id = t.id
          WHERE qt.question_id = q.id AND t.name = $${values.length}
        )
      `);
    }

    let orderBy = 'q.created_at DESC';
    if (params.sort === 'votes') {
      orderBy = 'q.score DESC, q.created_at DESC';
    } else if (params.sort === 'unanswered') {
      whereClauses.push('q.answers_count = 0');
      orderBy = 'q.created_at DESC';
    } else if (params.sort === 'trending') {
      orderBy = '(q.score * 3 + q.views_count + q.answers_count * 2) DESC, q.created_at DESC';
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count query
    const countQuery = `SELECT COUNT(*) AS count FROM questions q ${whereSql}`;
    const countResult = await this.db.query<{ count: string }>(countQuery, values);
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Data query with JSON aggregated tags and author
    const queryValues = [...values];
    queryValues.push(params.limit);
    const limitIdx = queryValues.length;
    queryValues.push(offset);
    const offsetIdx = queryValues.length;

    let userVoteSelect = 'NULL::smallint AS user_vote';
    let userBookmarkSelect = 'FALSE AS is_bookmarked';
    if (params.currentUserId) {
      queryValues.push(params.currentUserId);
      const userIdx = queryValues.length;
      userVoteSelect = `(SELECT v.value FROM votes v WHERE v.target_type = 'question' AND v.target_id = q.id AND v.user_id = $${userIdx}) AS user_vote`;
      userBookmarkSelect = `EXISTS(SELECT 1 FROM bookmarks b WHERE b.question_id = q.id AND b.user_id = $${userIdx}) AS is_bookmarked`;
    }

    const dataQuery = `
      SELECT
        q.id,
        q.author_id,
        u.display_name AS author_name,
        u.avatar_url AS author_avatar,
        u.reputation_total AS author_reputation,
        q.title,
        q.body,
        q.status,
        q.views_count,
        q.score,
        q.answers_count,
        q.created_at,
        q.updated_at,
        ${userVoteSelect},
        ${userBookmarkSelect},
        (SELECT COUNT(*) FROM medals m WHERE m.question_id = q.id)::int AS medals_count,
        EXISTS(SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_accepted = TRUE) AS has_accepted_answer,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
            FROM question_tags qt
            JOIN tags t ON qt.tag_id = t.id
            WHERE qt.question_id = q.id
          ),
          '[]'::json
        ) AS tags
      FROM questions q
      JOIN users u ON q.author_id = u.id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const dataResult = await this.db.query<QuestionListItem>(dataQuery, queryValues);
    return {
      questions: dataResult.rows,
      total,
    };
  }

  async findById(id: string, currentUserId?: string): Promise<QuestionDetail | null> {
    const values: any[] = [id];
    let userVoteSelect = 'NULL::smallint AS user_vote';
    let userBookmarkSelect = 'FALSE AS is_bookmarked';

    if (currentUserId) {
      values.push(currentUserId);
      userVoteSelect = `(SELECT v.value FROM votes v WHERE v.target_type = 'question' AND v.target_id = q.id AND v.user_id = $2) AS user_vote`;
      userBookmarkSelect = `EXISTS(SELECT 1 FROM bookmarks b WHERE b.question_id = q.id AND b.user_id = $2) AS is_bookmarked`;
    }

    const query = `
      SELECT
        q.id,
        q.author_id,
        u.display_name AS author_name,
        u.avatar_url AS author_avatar,
        u.reputation_total AS author_reputation,
        q.title,
        q.body,
        q.status,
        q.views_count,
        q.score,
        q.answers_count,
        q.created_at,
        q.updated_at,
        ${userVoteSelect},
        ${userBookmarkSelect},
        (SELECT COUNT(*) FROM medals m WHERE m.question_id = q.id)::int AS medals_count,
        EXISTS(SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_accepted = TRUE) AS has_accepted_answer,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
            FROM question_tags qt
            JOIN tags t ON qt.tag_id = t.id
            WHERE qt.question_id = q.id
          ),
          '[]'::json
        ) AS tags,
        (
          SELECT json_build_object(
            'status', ai.status,
            'response_text', ai.response_text,
            'model', ai.model
          )
          FROM question_ai_responses ai
          WHERE ai.question_id = q.id
        ) AS ai_response
      FROM questions q
      JOIN users u ON q.author_id = u.id
      WHERE q.id = $1 AND q.status != 'soft_deleted'
    `;

    const result = await this.db.query<QuestionDetail>(query, values);
    return result.rows[0] || null;
  }

  async incrementViews(id: string): Promise<void> {
    await this.db.query(
      'UPDATE questions SET views_count = views_count + 1 WHERE id = $1',
      [id],
    );
  }

  async create(authorId: string, title: string, body: string, tagNames: string[]): Promise<QuestionDetail> {
    return this.db.transaction(async (client) => {
      // 1. Insert question
      const questionResult = await client.query(
        `INSERT INTO questions (author_id, title, body, status, views_count, score, answers_count)
         VALUES ($1, $2, $3, 'open', 0, 0, 0)
         RETURNING id, author_id, title, body, status, views_count, score, answers_count, created_at, updated_at`,
        [authorId, title.trim(), body.trim()],
      );
      const question = questionResult.rows[0];

      // 2. Find or create tags
      const tags = await this.tagsRepo.findOrCreateTags(tagNames, client);

      // 3. Link tags and increment questions_count on each tag
      for (const tag of tags) {
        await client.query(
          `INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [question.id, tag.id],
        );
        await client.query(
          `UPDATE tags SET questions_count = questions_count + 1 WHERE id = $1`,
          [tag.id],
        );
      }

      // 4. Create pending placeholder row in question_ai_responses for view-answer AI
      await client.query(
        `INSERT INTO question_ai_responses (question_id, status)
         VALUES ($1, 'pending')
         ON CONFLICT (question_id) DO NOTHING`,
        [question.id],
      );

      // Fetch author info
      const author = await client.query(
        `SELECT display_name, avatar_url, reputation_total FROM users WHERE id = $1`,
        [authorId],
      );

      return {
        ...question,
        author_name: author.rows[0]?.display_name || '',
        author_avatar: author.rows[0]?.avatar_url || null,
        author_reputation: author.rows[0]?.reputation_total || 0,
        tags,
        medals_count: 0,
        has_accepted_answer: false,
        ai_response: {
          status: 'pending',
          response_text: null,
          model: null,
        },
      };
    });
  }

  async update(
    id: string,
    title?: string,
    body?: string,
    tagNames?: string[],
  ): Promise<void> {
    await this.db.transaction(async (client) => {
      if (title || body) {
        const setParts: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [id];

        if (title) {
          values.push(title.trim());
          setParts.push(`title = $${values.length}`);
        }
        if (body) {
          values.push(body.trim());
          setParts.push(`body = $${values.length}`);
        }

        await client.query(
          `UPDATE questions SET ${setParts.join(', ')} WHERE id = $1`,
          values,
        );
      }

      if (tagNames && tagNames.length > 0) {
        // Remove old tags count
        const oldTagsResult = await client.query<{ tag_id: string }>(
          'SELECT tag_id FROM question_tags WHERE question_id = $1',
          [id],
        );
        for (const row of oldTagsResult.rows) {
          await client.query(
            'UPDATE tags SET questions_count = GREATEST(0, questions_count - 1) WHERE id = $1',
            [row.tag_id],
          );
        }
        await client.query('DELETE FROM question_tags WHERE question_id = $1', [id]);

        // Add new tags
        const newTags = await this.tagsRepo.findOrCreateTags(tagNames, client);
        for (const tag of newTags) {
          await client.query(
            'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2)',
            [id, tag.id],
          );
          await client.query(
            'UPDATE tags SET questions_count = questions_count + 1 WHERE id = $1',
            [tag.id],
          );
        }
      }
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      "UPDATE questions SET status = 'soft_deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id],
    );
  }
}
