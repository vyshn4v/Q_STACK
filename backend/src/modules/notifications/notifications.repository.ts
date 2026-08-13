import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, any>;
  read_at: Date | null;
  created_at: Date;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly db: DatabaseService) {}

  async createNotification(
    userId: string,
    type: string,
    payload: Record<string, any>,
  ): Promise<NotificationRecord> {
    const query = `
      INSERT INTO notifications (user_id, type, payload)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, type, payload, read_at, created_at;
    `;
    const result = await this.db.query<NotificationRecord>(query, [
      userId,
      type,
      JSON.stringify(payload),
    ]);
    return result.rows[0];
  }

  async getUserNotifications(
    userId: string,
    limit = 30,
  ): Promise<{ notifications: NotificationRecord[]; unreadCount: number }> {
    const query = `
      SELECT id, user_id, type, payload, read_at, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const result = await this.db.query<NotificationRecord>(query, [userId, limit]);

    const countQuery = `
      SELECT COUNT(*) as unread
      FROM notifications
      WHERE user_id = $1 AND read_at IS NULL;
    `;
    const countResult = await this.db.query<{ unread: string }>(countQuery, [userId]);
    const unreadCount = parseInt(countResult.rows[0]?.unread || '0', 10);

    return {
      notifications: result.rows,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as unread
      FROM notifications
      WHERE user_id = $1 AND read_at IS NULL;
    `;
    const result = await this.db.query<{ unread: string }>(query, [userId]);
    return parseInt(result.rows[0]?.unread || '0', 10);
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE notifications
      SET read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND read_at IS NULL;
    `;
    const result = await this.db.query(query, [notificationId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE notifications
      SET read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND read_at IS NULL;
    `;
    const result = await this.db.query(query, [userId]);
    return result.rowCount ?? 0;
  }
}
