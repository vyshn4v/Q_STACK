import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { RedisService } from '../../redis/redis.service';
import type { IEventBus } from '../../redis/event-bus.interface';
import { UserRole } from '../../common/enums';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);
  private readonly feedCacheTtl: number;

  constructor(
    private readonly questionsRepo: QuestionsRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {
    this.feedCacheTtl = Number(
      this.configService.get<number>('FEED_CACHE_TTL_SECONDS', 60),
    );
  }

  async getQuestions(
    query: QueryQuestionsDto,
    currentUserId?: string,
  ): Promise<{ questions: QuestionListItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
    const sort = query.sort || 'newest';
    const tag = query.tag ? query.tag.toLowerCase().trim() : 'all';
    const search = query.search ? query.search.trim() : 'none';
    const userScope = currentUserId || 'anon';

    // 1. Build discrete Redis cache key
    const cacheKey = `feed:questions:${sort}:${tag}:${search}:${page}:${limit}:${userScope}`;

    // 2. Check Redis cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        this.logger.debug(`[Feed Cache HIT] key=${cacheKey}`);
        return parsed;
      } catch {
        // Fallback to database if parse fails
      }
    }

    // 3. Database query (pure raw SQL with PostgreSQL indexing)
    this.logger.debug(`[Feed Cache MISS] Querying database for key=${cacheKey}`);
    const result = await this.questionsRepo.findAll({
      tag: query.tag,
      sort,
      search: query.search,
      page,
      limit,
      currentUserId,
    });

    const response = {
      questions: result.questions,
      total: result.total,
      page,
      limit,
    };

    // 4. Cache in Redis with configurable TTL (default 60s / 1 min)
    await this.redisService.set(cacheKey, JSON.stringify(response), this.feedCacheTtl);

    return response;
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
  ): Promise<QuestionListItem> {
    const question = await this.questionsRepo.create(
      authorId,
      dto.title,
      dto.body,
      dto.tags,
    );

    // Invalidate feed cache on new question
    await this.redisService.delPattern('feed:questions:*');

    // Publish event
    await this.eventBus.publish('questions', {
      type: 'question.created',
      userId: authorId,
      timestamp: new Date().toISOString(),
      payload: {
        questionId: question.id,
        title: question.title,
        tags: question.tags.map((t) => t.name),
        body: question.body,
      },
    });

    return question;
  }

  async updateQuestion(
    questionId: string,
    userId: string,
    userRole: string,
    dto: UpdateQuestionDto,
  ): Promise<QuestionListItem> {
    const existing = await this.questionsRepo.findById(questionId);
    if (!existing) {
      throw new NotFoundException('Question not found.');
    }

    const isAuthor = existing.author_id === userId;
    const isPrivileged = [UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(
      userRole as UserRole,
    );

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('You do not have permission to edit this question.');
    }

    await this.questionsRepo.update(
      questionId,
      dto.title,
      dto.body,
      dto.tags,
    );

    const updated = await this.questionsRepo.findById(questionId, userId);
    if (!updated) {
      throw new NotFoundException('Question not found.');
    }

    // Invalidate feed cache on update
    await this.redisService.delPattern('feed:questions:*');

    return updated;
  }

  async deleteQuestion(
    questionId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const existing = await this.questionsRepo.findById(questionId);
    if (!existing) {
      throw new NotFoundException('Question not found.');
    }

    const isAuthor = existing.author_id === userId;
    const isPrivileged = [UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(
      userRole as UserRole,
    );

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('You do not have permission to delete this question.');
    }

    await this.questionsRepo.softDelete(questionId);

    // Invalidate feed cache on delete
    await this.redisService.delPattern('feed:questions:*');

    await this.eventBus.publish('questions', {
      type: 'question.deleted',
      userId,
      timestamp: new Date().toISOString(),
      payload: { questionId },
    });
  }
}
