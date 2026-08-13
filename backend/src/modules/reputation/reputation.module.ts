import { Module } from '@nestjs/common';
import { ReputationRepository } from './reputation.repository';
import { ReputationService } from './reputation.service';
import { ActivityConsumerService } from './activity-consumer.service';
import { ReputationController } from './reputation.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [NotificationsModule, RedisModule],
  controllers: [ReputationController],
  providers: [
    ReputationRepository,
    ReputationService,
    ActivityConsumerService,
  ],
  exports: [
    ReputationRepository,
    ReputationService,
  ],
})
export class ReputationModule {}
