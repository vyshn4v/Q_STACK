import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface AdminUserListItem {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  reputation_total: number;
  is_banned: boolean;
  questions_count: number;
  answers_count: number;
  reports_against_count: number;
  created_at: Date;
}

export interface AdminContentItem {
  id: string;
  target_type: 'question' | 'answer';
  title?: string;
  body: string;
  author_id: string;
  author_name: string;
  score: number;
  status: 'active' | 'soft_deleted';
  reports_count: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AdminRepository {
  constructor(private readonly db: DatabaseService) {}

  async getPlatformStats() {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM users)::int AS total_users,
        (SELECT COUNT(*) FROM users WHERE is_banned = TRUE)::int AS banned_users,
        (SELECT COUNT(*) FROM questions WHERE status != 'soft_deleted')::int AS active_questions,
        (SELECT COUNT(*) FROM answers WHERE status != 'soft_deleted')::int AS active_answers,
        (SELECT COUNT(*) FROM reports WHERE status IN ('reported', 'moderator_review', 'admin_review', 'super_admin_review'))::int AS pending_reports,
        (SELECT COUNT(*) FROM reports WHERE status = 'resolved')::int AS resolved_reports,
        (SELECT COUNT(*) FROM cron_runs WHERE status = 'completed')::int AS completed_cron_runs
    `;
    const result = await this.db.query(query);
    return result.rows[0];
  }

  async findUsers(params: {
    search?: string;
    role?: string;
    isBanned?: boolean;
    page: number;
    limit: number;
  }): Promise<{ users: AdminUserListItem[]; total: number }> {
    const offset = (params.page - 1) * params.limit;
    const values: any[] = [];
    const whereClauses: string[] = [];

    if (params.search) {
      values.push(`%${params.search}%`);
      whereClauses.push(`(u.display_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
    }

    if (params.role) {
      values.push(params.role);
      whereClauses.push(`u.role = $${values.length}`);
    }

    if (params.isBanned !== undefined) {
      values.push(params.isBanned);
      whereClauses.push(`u.is_banned = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users u ${whereSql}`,
      values,
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    const queryValues = [...values];
    queryValues.push(params.limit);
    const limitIdx = queryValues.length;
    queryValues.push(offset);
    const offsetIdx = queryValues.length;

    const query = `
      SELECT
        u.id,
        u.email,
        u.display_name,
        u.avatar_url,
        u.role,
        u.reputation_total,
        u.is_banned,
        (SELECT COUNT(*) FROM questions q WHERE q.author_id = u.id)::int AS questions_count,
        (SELECT COUNT(*) FROM answers a WHERE a.author_id = u.id)::int AS answers_count,
        (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'user' AND r.target_id = u.id)::int AS reports_against_count,
        u.created_at
      FROM users u
      ${whereSql}
      ORDER BY u.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await this.db.query<AdminUserListItem>(query, queryValues);
    return { users: result.rows, total };
  }

  async setUserBanStatus(userId: string, isBanned: boolean): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE users SET is_banned = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId, isBanned],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async setUserRole(userId: string, role: string): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE users SET role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId, role],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findContent(params: {
    targetType?: 'question' | 'answer';
    status?: 'active' | 'soft_deleted';
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminContentItem[]; total: number }> {
    const offset = (params.page - 1) * params.limit;
    const isQuestion = params.targetType !== 'answer';

    if (isQuestion) {
      const values: any[] = [];
      const whereClauses: string[] = [];

      if (params.status) {
        values.push(params.status);
        whereClauses.push(`q.status = $${values.length}`);
      }

      if (params.search) {
        values.push(`%${params.search}%`);
        whereClauses.push(`(q.title ILIKE $${values.length} OR q.body ILIKE $${values.length})`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const countResult = await this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM questions q ${whereSql}`,
        values,
      );
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      const queryValues = [...values, params.limit, offset];
      const query = `
        SELECT
          q.id,
          'question' AS target_type,
          q.title,
          q.body,
          q.author_id,
          u.display_name AS author_name,
          q.score,
          q.status,
          (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'question' AND r.target_id = q.id)::int AS reports_count,
          q.created_at,
          q.updated_at
        FROM questions q
        JOIN users u ON q.author_id = u.id
        ${whereSql}
        ORDER BY q.created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;
      const result = await this.db.query<AdminContentItem>(query, queryValues);
      return { items: result.rows, total };
    } else {
      const values: any[] = [];
      const whereClauses: string[] = [];

      if (params.status) {
        values.push(params.status);
        whereClauses.push(`a.status = $${values.length}`);
      }

      if (params.search) {
        values.push(`%${params.search}%`);
        whereClauses.push(`a.body ILIKE $${values.length}`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const countResult = await this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM answers a ${whereSql}`,
        values,
      );
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      const queryValues = [...values, params.limit, offset];
      const query = `
        SELECT
          a.id,
          'answer' AS target_type,
          q.title,
          a.body,
          a.author_id,
          u.display_name AS author_name,
          a.score,
          a.status,
          (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'answer' AND r.target_id = a.id)::int AS reports_count,
          a.created_at,
          a.updated_at
        FROM answers a
        JOIN users u ON a.author_id = u.id
        JOIN questions q ON a.question_id = q.id
        ${whereSql}
        ORDER BY a.created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;
      const result = await this.db.query<AdminContentItem>(query, queryValues);
      return { items: result.rows, total };
    }
  }

  async setContentStatus(
    targetType: 'question' | 'answer',
    targetId: string,
    status: 'active' | 'soft_deleted',
  ): Promise<boolean> {
    const table = targetType === 'question' ? 'questions' : 'answers';
    const result = await this.db.query(
      `UPDATE ${table} SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [targetId, status],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
