import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CastVoteDto } from './dto/vote.dto';
import { VotesRepository, VoteResult } from './votes.repository';
import type { IEventBus } from '../../redis/event-bus.interface';

@Injectable()
export class VotesService {
  constructor(
    private readonly votesRepo: VotesRepository,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  async castVote(userId: string, dto: CastVoteDto): Promise<VoteResult> {
    const target = await this.votesRepo.findTargetAuthor(dto.targetType, dto.targetId);
    if (!target) {
      throw new NotFoundException(`The specified ${dto.targetType} does not exist.`);
    }

    if (target.authorId === userId) {
      throw new ForbiddenException('You cannot vote on your own post.');
    }

    const result = await this.votesRepo.castOrToggleVote(
      userId,
      dto.targetType,
      dto.targetId,
      dto.value,
    );

    // Publish event for activity logging and nightly reputation computation
    await this.eventBus.publish('votes', {
      type: 'vote.cast',
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        targetAuthorId: result.authorId,
        voterId: userId,
        value: result.userVote,
        delta: result.delta,
      },
    });

    return result;
  }
}
