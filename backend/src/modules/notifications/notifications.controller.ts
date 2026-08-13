import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @CurrentUser('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '30', 10)));
    return this.notificationsService.getUserNotifications(userId, limitNum);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }
}
