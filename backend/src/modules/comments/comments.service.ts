import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { CommentItem, CommentsRepository } from './comments.repository';
import type { IEventBus } from '../../redis/event-bus.interface';
import { UserRole } from '../../common/enums';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepo: CommentsRepository,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  async getComments(
    parentType: 'question' | 'answer',
    parentId: string,
  ): Promise<CommentItem[]> {
    return this.commentsRepo.findByParent(parentType, parentId);
  }

  async createComment(
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentItem> {
    const comment = await this.commentsRepo.create(
      dto.parentType,
      dto.parentId,
      authorId,
      dto.body,
    );

    // Publish event for activity feed & notifications
    await this.eventBus.publish('comments', {
      type: 'comment.posted',
      userId: authorId,
      timestamp: new Date().toISOString(),
      payload: {
        commentId: comment.id,
        parentType: dto.parentType,
        parentId: dto.parentId,
        authorId,
        body: comment.body,
      },
    });

    return comment;
  }

  async updateComment(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateCommentDto,
  ): Promise<CommentItem> {
    const existing = await this.commentsRepo.findById(id);
    if (!existing) {
      throw new NotFoundException('Comment not found.');
    }

    const isAuthor = existing.author_id === userId;
    const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('You are not authorized to update this comment.');
    }

    await this.commentsRepo.update(id, dto.body);
    return (await this.commentsRepo.findById(id))!;
  }

  async deleteComment(id: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.commentsRepo.findById(id);
    if (!existing) {
      throw new NotFoundException('Comment not found.');
    }

    const isAuthor = existing.author_id === userId;
    const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('You are not authorized to delete this comment.');
    }

    await this.commentsRepo.softDelete(id);
  }
}
