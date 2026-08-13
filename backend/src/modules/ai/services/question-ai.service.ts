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

export interface QuestionAiResponseRow {
  question_id: string;
  response_text: string | null;
  model: string | null;
  status: 'pending' | 'ready' | 'failed';
  error_message: string | null;
  generated_at: Date | null;
  updated_at: Date;
}

@Injectable()
export class QuestionAiService {
  private readonly logger = new Logger(QuestionAiService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly llmService: LlmService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly pineconeService: PineconeService,
  ) {}

  /**
   * Fetch cached AI answer for a question (read-only cached, no repeat LLM invocations).
   */
  async getQuestionAnswer(questionId: string): Promise<QuestionAiResponseRow | null> {
    const result = await this.db.query<QuestionAiResponseRow>(
      `SELECT question_id, response_text, model, status, error_message, generated_at, updated_at
       FROM question_ai_responses
       WHERE question_id = $1`,
      [questionId],
    );
    return result.rows[0] || null;
  }

  /**
   * Asynchronously generate and persist per-question AI technical summary into question_ai_responses.
   * Also indexes the question vector into Pinecone for RAG retrieval.
   */
  async generateAndCacheQuestionAnswer(questionId: string): Promise<QuestionAiResponseRow> {
    // 1. Fetch Question details
    const qResult = await this.db.query<{
      id: string;
      title: string;
      body: string;
      author_id: string;
    }>(
      `SELECT id, title, body, author_id FROM questions WHERE id = $1 AND status != 'soft_deleted'`,
      [questionId],
    );

    if (qResult.rows.length === 0) {
      throw new NotFoundException('Question not found');
    }
    const question = qResult.rows[0];

    // 2. Fetch tags
    const tagsResult = await this.db.query<{ name: string }>(
      `SELECT t.name FROM tags t
       JOIN question_tags qt ON t.id = qt.tag_id
       WHERE qt.question_id = $1`,
      [questionId],
    );
    const tags = tagsResult.rows.map((t) => t.name);

    // 3. Mark status as pending
    await this.db.query(
      `INSERT INTO question_ai_responses (question_id, status, updated_at)
       VALUES ($1, 'pending', CURRENT_TIMESTAMP)
       ON CONFLICT (question_id) DO UPDATE
       SET status = 'pending', updated_at = CURRENT_TIMESTAMP`,
      [questionId],
    );

    try {
      // 4. Generate AI technical answer
      this.logger.log(`Generating AI answer for question ${questionId}: "${question.title}"`);
      const { text, model } = await this.llmService.generateQuestionAnswer(
        question.title,
        question.body,
        tags,
      );

      // 5. Update response in database
      const updateResult = await this.db.query<QuestionAiResponseRow>(
        `UPDATE question_ai_responses
         SET response_text = $2,
             model = $3,
             status = 'ready',
             error_message = NULL,
             generated_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE question_id = $1
         RETURNING *`,
        [questionId, text, model],
      );

      // 6. Ingest into Pinecone for RAG (Feature B)
      this.ingestQuestionVector(question.id, question.title, question.body, tags).catch((err) => {
        this.logger.warn(`Pinecone ingestion background error for question ${questionId}: ${err.message}`);
      });

      return updateResult.rows[0];
    } catch (err: any) {
      this.logger.error(`Failed to generate AI response for question ${questionId}: ${err.message}`);
      await this.db.query(
        `UPDATE question_ai_responses
         SET status = 'failed',
             error_message = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE question_id = $1`,
        [questionId, err.message],
      );
      throw err;
    }
  }

  /**
   * Explicit re-generation allowed only by question author or moderator/admin.
   */
  async regenerateQuestionAnswer(
    questionId: string,
    userId: string,
    userRole: string,
  ): Promise<QuestionAiResponseRow> {
    const qResult = await this.db.query<{ author_id: string }>(
      `SELECT author_id FROM questions WHERE id = $1`,
      [questionId],
    );
    if (qResult.rows.length === 0) {
      throw new NotFoundException('Question not found');
    }

    const isAuthor = qResult.rows[0].author_id === userId;
    const isPrivileged = ['moderator', 'admin', 'super_admin'].includes(userRole);

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('Only the question author or moderators can regenerate the AI summary.');
    }

    return this.generateAndCacheQuestionAnswer(questionId);
  }

  /**
   * Helper to create embedding and upsert to Pinecone
   */
  private async ingestQuestionVector(
    questionId: string,
    title: string,
    body: string,
    tags: string[],
  ): Promise<void> {
    const textToEmbed = `Title: ${title}\nTags: ${tags.join(', ')}\nContent: ${body.slice(0, 1500)}`;
    const vector = await this.embeddingsService.generateEmbedding(textToEmbed, 'passage');

    if (vector) {
      await this.pineconeService.upsertVector(questionId, vector, {
        questionId,
        title,
        snippet: body.slice(0, 300),
        tags,
        contentType: 'question',
      });
    }
  }
}
