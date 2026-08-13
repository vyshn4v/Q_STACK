import { Inject, Injectable } from '@nestjs/common';
import { BookmarksRepository } from './bookmarks.repository';
import type { IEventBus } from '../../redis/event-bus.interface';

@Injectable()
export class BookmarksService {
  constructor(
    private readonly bookmarksRepo: BookmarksRepository,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  async toggleBookmark(userId: string, questionId: string) {
    const isBookmarked = await this.bookmarksRepo.isBookmarked(userId, questionId);

    if (isBookmarked) {
      await this.bookmarksRepo.removeBookmark(userId, questionId);
      return {
        questionId,
        isBookmarked: false,
      };
    } else {
      await this.bookmarksRepo.addBookmark(userId, questionId);

      // Emit bookmark event
      await this.eventBus.publish('activity_events', {
        type: 'question.bookmarked',
        timestamp: new Date().toISOString(),
        userId,
        payload: {
          questionId,
        },
      });

      return {
        questionId,
        isBookmarked: true,
      };
    }
  }

  async isBookmarked(userId: string, questionId: string) {
    const isBookmarked = await this.bookmarksRepo.isBookmarked(userId, questionId);
    return {
      questionId,
      isBookmarked,
    };
  }

  async getUserBookmarks(userId: string, page = 1, limit = 20) {
    return this.bookmarksRepo.getUserBookmarks(userId, page, limit);
  }
}
