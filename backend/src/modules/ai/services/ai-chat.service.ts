import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { LlmService } from './llm.service';
import { EmbeddingsService } from './embeddings.service';
import { PineconeService } from './pinecone.service';

export interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: Date;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly llmService: LlmService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly pineconeService: PineconeService,
  ) {}

  async createSession(userId: string, title = 'New Conversation'): Promise<ChatSessionRow> {
    const result = await this.db.query<ChatSessionRow>(
      `INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, title.slice(0, 255)],
    );
    return result.rows[0];
  }

  async getUserSessions(userId: string): Promise<ChatSessionRow[]> {
    const result = await this.db.query<ChatSessionRow>(
      `SELECT id, user_id, title, created_at, updated_at
       FROM chat_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async getSessionMessages(userId: string, sessionId: string): Promise<ChatMessageRow[]> {
    await this.validateSessionOwnership(userId, sessionId);

    const result = await this.db.query<ChatMessageRow>(
      `SELECT id, session_id, role, content, metadata, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId],
    );
    return result.rows;
  }

  async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    await this.validateSessionOwnership(userId, sessionId);

    const result = await this.db.query(
      `DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Process a user chat message through RAG retrieval + LLM synthesis
   */
  async processUserMessage(
    userId: string,
    sessionId: string,
    messageText: string,
  ): Promise<{ userMessage: ChatMessageRow; assistantMessage: ChatMessageRow }> {
    const session = await this.validateSessionOwnership(userId, sessionId);

    // 1. Insert User Message
    const userMsgResult = await this.db.query<ChatMessageRow>(
      `INSERT INTO chat_messages (session_id, role, content, metadata, created_at)
       VALUES ($1, 'user', $2, '{}'::jsonb, CURRENT_TIMESTAMP)
       RETURNING *`,
      [sessionId, messageText],
    );
    const userMessage = userMsgResult.rows[0];

    // 2. Fetch recent conversation history
    const historyResult = await this.db.query<{ role: string; content: string }>(
      `SELECT role, content FROM chat_messages
       WHERE session_id = $1 AND id != $2
       ORDER BY created_at DESC
       LIMIT 6`,
      [sessionId, userMessage.id],
    );
    const history = historyResult.rows.reverse();

    // 3. RAG Retrieval via Pinecone
    const contextSnippets: string[] = [];
    const citations: Array<{ id: string; title: string; score: number }> = [];

    try {
      const queryVector = await this.embeddingsService.generateEmbedding(messageText, 'query');
      if (queryVector) {
        const matches = await this.pineconeService.querySimilar(queryVector, 3);
        for (const match of matches) {
          if (match.metadata?.title && match.metadata?.snippet) {
            contextSnippets.push(`[Post: ${match.metadata.title}]\n${match.metadata.snippet}`);
            citations.push({
              id: match.metadata.questionId || match.id,
              title: match.metadata.title,
              score: Math.round(match.score * 100) / 100,
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Pinecone RAG retrieval skipped: ${err.message}`);
    }

    // 4. Synthesize AI response
    const { text, model } = await this.llmService.generateRagChatResponse(
      messageText,
      history,
      contextSnippets,
    );

    // 5. Insert Assistant Message
    const assistantMsgResult = await this.db.query<ChatMessageRow>(
      `INSERT INTO chat_messages (session_id, role, content, metadata, created_at)
       VALUES ($1, 'assistant', $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [sessionId, text, JSON.stringify({ model, citations })],
    );
    const assistantMessage = assistantMsgResult.rows[0];

    // 6. Update Session timestamp and generate title if it was first message
    const isFirstExchange = history.length === 0;
    const newTitle = isFirstExchange
      ? messageText.slice(0, 45) + (messageText.length > 45 ? '...' : '')
      : session.title;

    await this.db.query(
      `UPDATE chat_sessions
       SET title = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [sessionId, newTitle],
    );

    return {
      userMessage,
      assistantMessage,
    };
  }

  private async validateSessionOwnership(userId: string, sessionId: string): Promise<ChatSessionRow> {
    const result = await this.db.query<ChatSessionRow>(
      `SELECT id, user_id, title, created_at, updated_at
       FROM chat_sessions
       WHERE id = $1`,
      [sessionId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Chat session not found');
    }

    const session = result.rows[0];
    if (session.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this chat session');
    }

    return session;
  }
}
