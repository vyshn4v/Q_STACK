import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    NotificationsService,
    NotificationsGateway,
  ],
  exports: [
    NotificationsRepository,
    NotificationsService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
