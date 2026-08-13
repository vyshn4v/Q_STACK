import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { FollowsRepository } from './follows.repository';
import type { IEventBus } from '../../redis/event-bus.interface';
import { ToggleFollowDto } from './dto/follows.dto';

@Injectable()
export class FollowsService {
  constructor(
    private readonly followsRepo: FollowsRepository,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  async toggleFollow(userId: string, dto: ToggleFollowDto) {
    if (dto.targetType === 'user' && dto.targetId === userId) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    const isFollowing = await this.followsRepo.isFollowing(userId, dto.targetType, dto.targetId);

    if (isFollowing) {
      await this.followsRepo.unfollow(userId, dto.targetType, dto.targetId);
      return {
        targetType: dto.targetType,
        targetId: dto.targetId,
        isFollowing: false,
      };
    } else {
      await this.followsRepo.follow(userId, dto.targetType, dto.targetId);

      // Emit follow event
      await this.eventBus.publish('activity_events', {
        type: `${dto.targetType}.followed`,
        timestamp: new Date().toISOString(),
        userId,
        payload: {
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
      });

      return {
        targetType: dto.targetType,
        targetId: dto.targetId,
        isFollowing: true,
      };
    }
  }

  async getFollowStatus(userId: string, targetType: 'user' | 'tag' | 'question', targetId: string) {
    const isFollowing = await this.followsRepo.isFollowing(userId, targetType, targetId);
    return {
      targetType,
      targetId,
      isFollowing,
    };
  }

  async getFollowingUsers(userId: string) {
    return this.followsRepo.getFollowingUsers(userId);
  }

  async getFollowingTags(userId: string) {
    return this.followsRepo.getFollowingTags(userId);
  }
}
