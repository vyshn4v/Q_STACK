import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MedalsRepository } from './medals.repository';
import type { IEventBus } from '../../redis/event-bus.interface';
import { GiveMedalDto } from './dto/medals.dto';

@Injectable()
export class MedalsService {
  constructor(
    private readonly medalsRepo: MedalsRepository,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  async giveMedal(userId: string, dto: GiveMedalDto) {
    const authorId = await this.medalsRepo.getQuestionAuthorId(dto.questionId);
    if (!authorId) {
      throw new NotFoundException('Question not found');
    }

    if (authorId === userId) {
      throw new ForbiddenException('You cannot give a medal to your own question.');
    }

    const medal = await this.medalsRepo.giveOrUpdateMedal(dto.questionId, userId, dto.tier);

    // Emit medal.given event for activity feed & nightly reputation/badge calculations
    await this.eventBus.publish('activity_events', {
      type: 'medal.given',
      timestamp: new Date().toISOString(),
      userId,
      payload: {
        questionId: dto.questionId,
        questionAuthorId: authorId,
        tier: dto.tier,
      },
    });

    const summary = await this.medalsRepo.getQuestionMedalsSummary(dto.questionId, userId);
    return {
      medal,
      summary,
    };
  }

  async removeMedal(userId: string, questionId: string) {
    const removed = await this.medalsRepo.removeMedal(questionId, userId);
    if (!removed) {
      throw new BadRequestException('No medal found to remove');
    }
    return this.medalsRepo.getQuestionMedalsSummary(questionId, userId);
  }

  async getQuestionMedals(questionId: string, userId?: string) {
    return this.medalsRepo.getQuestionMedalsSummary(questionId, userId);
  }
}
