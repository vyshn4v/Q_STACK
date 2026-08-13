import { Module } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [NotificationsModule, RedisModule],
  controllers: [ReportsController],
  providers: [ReportsRepository, ReportsService],
  exports: [ReportsRepository, ReportsService],
})
export class ReportsModule {}
