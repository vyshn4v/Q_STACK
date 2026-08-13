import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { IEventBus } from '../../redis/event-bus.interface';
import { QuestionAiService } from './services/question-ai.service';

@Injectable()
export class AiConsumerService implements OnModuleInit {
  private readonly logger = new Logger(AiConsumerService.name);

  constructor(
    @Inject('IEventBus') private readonly eventBus: IEventBus,
    private readonly questionAiService: QuestionAiService,
  ) {}

  async onModuleInit() {
    this.logger.log('Registering Redis Stream event consumer for AI Pipeline...');

    // Subscribe to questions stream for AI answer generation
    await this.eventBus.subscribe(
      'questions',
      'ai-generation-group',
      'ai-worker-1',
      async (event) => {
        if (event.type === 'question.created') {
          const questionId = event.payload?.id || event.payload?.questionId;
          if (questionId) {
            this.logger.log(`Received question.created event for ${questionId}. Dispatching AI generation...`);
            this.questionAiService
              .generateAndCacheQuestionAnswer(questionId)
              .catch((err) => {
                this.logger.error(`Background AI generation failed for question ${questionId}: ${err.message}`);
              });
          }
        }
      },
    );
  }
}
