import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ReportRow {
  id: string;
  target_type: 'question' | 'answer' | 'comment' | 'user';
  target_id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_avatar: string | null;
  reason: string;
  status: 'reported' | 'moderator_review' | 'admin_review' | 'super_admin_review' | 'resolved' | 'dismissed';
  escalation_level: 'moderator' | 'admin' | 'super_admin';
  action_taken: string | null;
  resolved_by_user_id: string | null;
  resolved_by_name: string | null;
  created_at: Date;
  updated_at: Date;
  target_title?: string | null;
  target_snippet?: string | null;
}

@Injectable()
export class ReportsRepository {
  private readonly AUTO_ESCALATE_THRESHOLD = 3;

  constructor(private readonly db: DatabaseService) {}

  async createReport(
    reporterId: string,
    targetType: 'question' | 'answer' | 'comment' | 'user',
    targetId: string,
    reason: string,
  ): Promise<{ report: ReportRow; autoEscalated: boolean }> {
    return this.db.transaction(async (client) => {
      // 1. Insert report
      const insertResult = await client.query<{ id: string }>(
        `INSERT INTO reports (target_type, target_id, reporter_id, reason, status, escalation_level, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'moderator_review', 'moderator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [targetType, targetId, reporterId, reason],
      );
      const reportId = insertResult.rows[0].id;

      // 2. Check total active reports on this specific target
      const countResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM reports
         WHERE target_type = $1 AND target_id = $2 AND status IN ('reported', 'moderator_review')`,
        [targetType, targetId],
      );
      const activeCount = parseInt(countResult.rows[0]?.count || '1', 10);
      let autoEscalated = false;

      // 3. High volume auto-escalation rule
      if (activeCount >= this.AUTO_ESCALATE_THRESHOLD) {
        await client.query(
          `UPDATE reports
           SET escalation_level = 'admin',
               status = 'admin_review',
               updated_at = CURRENT_TIMESTAMP
           WHERE target_type = $1 AND target_id = $2 AND status IN ('reported', 'moderator_review')`,
          [targetType, targetId],
        );
        autoEscalated = true;
      }

      const report = await this.findReportById(reportId);
      return { report: report!, autoEscalated };
    });
  }

  async findReports(params: {
    status?: string;
    escalationLevel?: string;
    targetType?: string;
    page: number;
    limit: number;
  }): Promise<{ reports: ReportRow[]; total: number }> {
    const offset = (params.page - 1) * params.limit;
    const values: any[] = [];
    const whereClauses: string[] = [];

    if (params.status) {
      values.push(params.status);
      whereClauses.push(`r.status = $${values.length}`);
    }

    if (params.escalationLevel) {
      values.push(params.escalationLevel);
      whereClauses.push(`r.escalation_level = $${values.length}`);
    }

    if (params.targetType) {
      values.push(params.targetType);
      whereClauses.push(`r.target_type = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM reports r ${whereSql}`,
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
        r.id,
        r.target_type,
        r.target_id,
        r.reporter_id,
        u_rep.display_name AS reporter_name,
        u_rep.avatar_url AS reporter_avatar,
        r.reason,
        r.status,
        r.escalation_level,
        r.action_taken,
        r.resolved_by_user_id,
        u_res.display_name AS resolved_by_name,
        r.created_at,
        r.updated_at,
        CASE
          WHEN r.target_type = 'question' THEN (SELECT q.title FROM questions q WHERE q.id = r.target_id)
          WHEN r.target_type = 'answer' THEN (SELECT q.title FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.id = r.target_id)
          WHEN r.target_type = 'user' THEN (SELECT u.display_name FROM users u WHERE u.id = r.target_id)
          ELSE NULL
        END AS target_title,
        CASE
          WHEN r.target_type = 'question' THEN (SELECT SUBSTRING(q.body, 1, 200) FROM questions q WHERE q.id = r.target_id)
          WHEN r.target_type = 'answer' THEN (SELECT SUBSTRING(a.body, 1, 200) FROM answers a WHERE a.id = r.target_id)
          WHEN r.target_type = 'comment' THEN (SELECT SUBSTRING(c.body, 1, 200) FROM comments c WHERE c.id = r.target_id)
          WHEN r.target_type = 'user' THEN (SELECT u.bio FROM users u WHERE u.id = r.target_id)
          ELSE NULL
        END AS target_snippet
      FROM reports r
      LEFT JOIN users u_rep ON r.reporter_id = u_rep.id
      LEFT JOIN users u_res ON r.resolved_by_user_id = u_res.id
      ${whereSql}
      ORDER BY r.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await this.db.query<ReportRow>(query, queryValues);
    return { reports: result.rows, total };
  }

  async findReportById(id: string): Promise<ReportRow | null> {
    const query = `
      SELECT
        r.id,
        r.target_type,
        r.target_id,
        r.reporter_id,
        u_rep.display_name AS reporter_name,
        u_rep.avatar_url AS reporter_avatar,
        r.reason,
        r.status,
        r.escalation_level,
        r.action_taken,
        r.resolved_by_user_id,
        u_res.display_name AS resolved_by_name,
        r.created_at,
        r.updated_at,
        CASE
          WHEN r.target_type = 'question' THEN (SELECT q.title FROM questions q WHERE q.id = r.target_id)
          WHEN r.target_type = 'answer' THEN (SELECT q.title FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.id = r.target_id)
          WHEN r.target_type = 'user' THEN (SELECT u.display_name FROM users u WHERE u.id = r.target_id)
          ELSE NULL
        END AS target_title,
        CASE
          WHEN r.target_type = 'question' THEN (SELECT SUBSTRING(q.body, 1, 300) FROM questions q WHERE q.id = r.target_id)
          WHEN r.target_type = 'answer' THEN (SELECT SUBSTRING(a.body, 1, 300) FROM answers a WHERE a.id = r.target_id)
          WHEN r.target_type = 'comment' THEN (SELECT SUBSTRING(c.body, 1, 300) FROM comments c WHERE c.id = r.target_id)
          WHEN r.target_type = 'user' THEN (SELECT u.bio FROM users u WHERE u.id = r.target_id)
          ELSE NULL
        END AS target_snippet
      FROM reports r
      LEFT JOIN users u_rep ON r.reporter_id = u_rep.id
      LEFT JOIN users u_res ON r.resolved_by_user_id = u_res.id
      WHERE r.id = $1
    `;
    const result = await this.db.query<ReportRow>(query, [id]);
    return result.rows[0] || null;
  }

  async updateReportEscalation(
    id: string,
    nextLevel: 'admin' | 'super_admin',
    nextStatus: 'admin_review' | 'super_admin_review',
  ): Promise<ReportRow> {
    const result = await this.db.query<ReportRow>(
      `UPDATE reports
       SET escalation_level = $2,
           status = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, nextLevel, nextStatus],
    );
    return result.rows[0];
  }

  async resolveReport(
    id: string,
    resolvedByUserId: string,
    actionTaken: string,
    finalStatus: 'resolved' | 'dismissed',
  ): Promise<ReportRow> {
    const result = await this.db.query<ReportRow>(
      `UPDATE reports
       SET status = $2,
           action_taken = $3,
           resolved_by_user_id = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, finalStatus, actionTaken, resolvedByUserId],
    );
    return result.rows[0];
  }
}
