import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepo: NotificationsRepository,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(userId: string, type: string, payload: Record<string, any>) {
    const record = await this.notificationsRepo.createNotification(userId, type, payload);

    // Stream realtime notification to connected user
    this.notificationsGateway.sendNotificationToUser(userId, record);

    return record;
  }

  async getUserNotifications(userId: string, limit = 30) {
    return this.notificationsRepo.getUserNotifications(userId, limit);
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.notificationsRepo.getUnreadCount(userId);
    return { unreadCount };
  }

  async markAsRead(notificationId: string, userId: string) {
    const success = await this.notificationsRepo.markAsRead(notificationId, userId);
    const unreadCount = await this.notificationsRepo.getUnreadCount(userId);
    return {
      success,
      unreadCount,
    };
  }

  async markAllAsRead(userId: string) {
    const updatedCount = await this.notificationsRepo.markAllAsRead(userId);
    return {
      updatedCount,
      unreadCount: 0,
    };
  }
}
