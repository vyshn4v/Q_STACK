import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { QuestionAiService } from './services/question-ai.service';
import { AiChatService } from './services/ai-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSessionDto, SendChatMessageDto } from './dto/ai-chat.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly questionAiService: QuestionAiService,
    private readonly aiChatService: AiChatService,
  ) {}

  // ==========================================
  // Part A: Cached Per-Question AI Responses
  // ==========================================

  @Public()
  @Get('questions/:id')
  async getQuestionAiAnswer(@Param('id') questionId: string) {
    const answer = await this.questionAiService.getQuestionAnswer(questionId);
    return answer || { status: 'pending', response_text: null };
  }

  @UseGuards(JwtAuthGuard)
  @Post('questions/:id/regenerate')
  async regenerateQuestionAiAnswer(
    @Param('id') questionId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.questionAiService.regenerateQuestionAnswer(questionId, userId, role);
  }

  // ==========================================
  // Part B: AI Chat Sessions & Pinecone RAG
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @Get('chat/sessions')
  async getUserChatSessions(@CurrentUser('userId') userId: string) {
    return this.aiChatService.getUserSessions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat/sessions')
  async createChatSession(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.aiChatService.createSession(userId, dto.title);
  }

  @UseGuards(JwtAuthGuard)
  @Get('chat/sessions/:id')
  async getSessionMessages(
    @Param('id') sessionId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.aiChatService.getSessionMessages(userId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('chat/sessions/:id')
  async deleteChatSession(
    @Param('id') sessionId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.aiChatService.deleteSession(userId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat/sessions/:id/messages')
  async sendChatMessage(
    @Param('id') sessionId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.aiChatService.processUserMessage(userId, sessionId, dto.message);
  }
}
