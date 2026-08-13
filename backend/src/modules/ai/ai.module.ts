import { Module } from '@nestjs/common';
import { LlmService } from './services/llm.service';
import { EmbeddingsService } from './services/embeddings.service';
import { PineconeService } from './services/pinecone.service';
import { QuestionAiService } from './services/question-ai.service';
import { AiChatService } from './services/ai-chat.service';
import { AiConsumerService } from './ai-consumer.service';
import { AiController } from './ai.controller';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [AiController],
  providers: [
    LlmService,
    EmbeddingsService,
    PineconeService,
    QuestionAiService,
    AiChatService,
    AiConsumerService,
  ],
  exports: [
    QuestionAiService,
    AiChatService,
    LlmService,
    PineconeService,
  ],
})
export class AiModule {}
