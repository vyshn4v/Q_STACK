import { Module } from '@nestjs/common';
import { FollowsRepository } from './follows.repository';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';

@Module({
  controllers: [FollowsController],
  providers: [FollowsRepository, FollowsService],
  exports: [FollowsRepository, FollowsService],
})
export class FollowsModule {}
