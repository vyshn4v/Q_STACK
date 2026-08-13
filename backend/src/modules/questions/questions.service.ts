import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateQuestionDto,
  QueryQuestionsDto,
  UpdateQuestionDto,
} from './dto/question.dto';
import {
  QuestionDetail,
  QuestionListItem,
  QuestionsRepository,
} from './questions.repository';
import { IEventBus } from '../../redis/event-bus.interface';
import { UserRole } from '../../common/enums';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private readonly questionsRepo: QuestionsRepository,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  async getQuestions(
    query: QueryQuestionsDto,
    currentUserId?: string,
  ): Promise<{ questions: QuestionListItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));

    const result = await this.questionsRepo.findAll({
      tag: query.tag,
      sort: query.sort || 'newest',
      search: query.search,
      page,
      limit,
      currentUserId,
    });

    return {
      questions: result.questions,
      total: result.total,
      page,
      limit,
    };
  }

  async getQuestionById(id: string, currentUserId?: string): Promise<QuestionDetail> {
    const question = await this.questionsRepo.findById(id, currentUserId);
    if (!question) {
      throw new NotFoundException('Question not found.');
    }

    // Increment view asynchronously & publish event
    this.questionsRepo.incrementViews(id).catch((err) => {
      this.logger.warn(`Could not increment views on question ${id}: ${err.message}`);
    });

    this.eventBus.publish('questions', {
      type: 'question.viewed',
      userId: currentUserId,
      timestamp: new Date().toISOString(),
      payload: { questionId: id, authorId: question.author_id },
    }).catch(() => {});

    return question;
  }

  async createQuestion(
    authorId: string,
    dto: CreateQuestionDto,
  ): Promise<QuestionDetail> {
    const question = await this.questionsRepo.create(
      authorId,
      dto.title,
      dto.body,
      dto.tags,
    );

    // Publish event for AI Ingestion worker and Activity Log
    await this.eventBus.publish('questions', {
      type: 'question.created',
      userId: authorId,
      timestamp: new Date().toISOString(),
      payload: {
        questionId: question.id,
        authorId,
        title: question.title,
        body: question.body,
        tags: dto.tags,
      },
    });

    return question;
  }

  async updateQuestion(
    id: string,
    authorId: string,
    userRole: string,
    dto: UpdateQuestionDto,
  ): Promise<QuestionDetail> {
    const existing = await this.questionsRepo.findById(id);
    if (!existing) {
      throw new NotFoundException('Question not found.');
    }

    const isAuthor = existing.author_id === authorId;
    const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('You are not authorized to edit this question.');
    }

    await this.questionsRepo.update(id, dto.title, dto.body, dto.tags);
    return this.getQuestionById(id, authorId);
  }

  async deleteQuestion(id: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.questionsRepo.findById(id);
    if (!existing) {
      throw new NotFoundException('Question not found.');
    }

    const isAuthor = existing.author_id === userId;
    const isPrivileged = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('You are not authorized to delete this question.');
    }

    await this.questionsRepo.softDelete(id);
  }
}
