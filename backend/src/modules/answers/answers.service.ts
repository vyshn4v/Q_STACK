import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAnswerDto, UpdateAnswerDto } from './dto/answer.dto';
import { AnswerItem, AnswersRepository } from './answers.repository';
import { QuestionsRepository } from '../questions/questions.repository';
import type { IEventBus } from '../../redis/event-bus.interface';
import { UserRole } from '../../common/enums';

@Injectable()
export class AnswersService {
  constructor(
    private readonly answersRepo: AnswersRepository,
    private readonly questionsRepo: QuestionsRepository,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  async getAnswersForQuestion(
    questionId: string,
    currentUserId?: string,
  ): Promise<AnswerItem[]> {
    return this.answersRepo.findByQuestionId(questionId, currentUserId);
  }

  async createAnswer(
    questionId: string,
    authorId: string,
    dto: CreateAnswerDto,
  ): Promise<AnswerItem> {
    const question = await this.questionsRepo.findById(questionId);
    if (!question) {
      throw new NotFoundException('Question not found.');
    }
    if (question.status === 'closed') {
      throw new ForbiddenException('Cannot answer a closed question.');
    }

    const answer = await this.answersRepo.create(questionId, authorId, dto.body);

    // Publish event for Pinecone ingestion, notifications, and activity feed
    await this.eventBus.publish('answers', {
      type: 'answer.posted',
      userId: authorId,
      timestamp: new Date().toISOString(),
      payload: {
        answerId: answer.id,
        questionId,
        questionTitle: question.title,
        questionAuthorId: question.author_id,
        authorId,
        body: answer.body,
      },
    });

    return answer;
  }

  async acceptAnswer(
    answerId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const answer = await this.answersRepo.findById(answerId);
    if (!answer) {
      throw new NotFoundException('Answer not found.');
    }

    const question = await this.questionsRepo.findById(answer.question_id);
    if (!question) {
      throw new NotFoundException('Parent question not found.');
    }

    const isQuestionAuthor = question.author_id === userId;
    const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isQuestionAuthor && !isPrivileged) {
      throw new ForbiddenException('Only the question author can accept an answer.');
    }

    await this.answersRepo.acceptAnswer(answerId, answer.question_id);

    // Publish event for reputation and notification consumers
    await this.eventBus.publish('answers', {
      type: 'answer.accepted',
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        answerId,
        questionId: question.id,
        answerAuthorId: answer.author_id,
        acceptedByUserId: userId,
      },
    });
  }

  async updateAnswer(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateAnswerDto,
  ): Promise<AnswerItem> {
    const existing = await this.answersRepo.findById(id);
    if (!existing) {
      throw new NotFoundException('Answer not found.');
    }

    const isAuthor = existing.author_id === userId;
    const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('You are not authorized to update this answer.');
    }

    await this.answersRepo.update(id, dto.body);
    return (await this.answersRepo.findById(id))!;
  }

  async deleteAnswer(id: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.answersRepo.findById(id);
    if (!existing) {
      throw new NotFoundException('Answer not found.');
    }

    const isAuthor = existing.author_id === userId;
    const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('You are not authorized to delete this answer.');
    }

    await this.answersRepo.softDelete(id, existing.question_id);
  }
}
