import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly openrouterKey: string;
  private readonly openrouterBaseUrl: string;
  private readonly openrouterModel: string;
  private readonly nvidiaKey: string;
  private readonly nvidiaBaseUrl: string;
  private readonly nvidiaModel: string;

  constructor(private readonly config: ConfigService) {
    this.openrouterKey = this.config.get<string>('OPENROUTER_API_KEY', '');
    this.openrouterBaseUrl = this.config.get<string>('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    this.openrouterModel = this.config.get<string>('OPENROUTER_CHAT_MODEL', 'meta-llama/llama-3.1-8b-instruct:free');

    this.nvidiaKey = this.config.get<string>('NVIDIA_NIM_API_KEY', '');
    this.nvidiaBaseUrl = this.config.get<string>('NVIDIA_NIM_BASE_URL', 'https://integrate.api.nvidia.com/v1');
    this.nvidiaModel = this.config.get<string>('NVIDIA_NIM_CHAT_MODEL', 'meta/llama-3.1-8b-instruct');
  }

  /**
   * Generate cached technical summary / solution breakdown for a newly posted question.
   */
  async generateQuestionAnswer(title: string, body: string, tags: string[] = []): Promise<{ text: string; model: string }> {
    const prompt = `You are the QStack AI Technical Architect. Provide a clear, structured, and accurate technical solution and architectural analysis for the following developer problem:

Question Title: ${title}
Tags: ${tags.join(', ')}

Problem Description:
${body}

Format your response in GitHub-flavored Markdown:
1. **Summary of Issue**: Direct 1-2 sentence diagnosis of the core technical cause.
2. **Recommended Solution**: Step-by-step resolution with clean, commented code examples where applicable.
3. **Key Considerations & Best Practices**: Edge cases, performance implications, or security precautions.

Keep the tone concise, authoritative, and direct.`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert full-stack developer and systems architect delivering high-quality programming solutions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.completeChat(messages, 1200);
  }

  /**
   * Generate conversational RAG response incorporating platform knowledge context snippets.
   */
  async generateRagChatResponse(
    userMessage: string,
    history: Array<{ role: string; content: string }>,
    contextSnippets: string[] = [],
  ): Promise<{ text: string; model: string }> {
    let contextBlock = '';
    if (contextSnippets.length > 0) {
      contextBlock = `\n\n--- RELEVANT QSTACK COMMUNITY DISCUSSIONS ---\n${contextSnippets.join('\n\n---\n\n')}\n--- END COMMUNITY CONTEXT ---\n`;
    }

    const systemPrompt = `You are QStack AI, an intelligent coding companion for developers.
Use the provided community discussions context where helpful to answer the developer's question accurately.
If the context contains the direct answer, reference the technical approach.
Provide clean code examples, explain trade-offs, and be concise.${contextBlock}`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    return this.completeChat(formattedMessages, 1500);
  }

  /**
   * Execute chat completion via OpenRouter with automatic fallback to NVIDIA NIM
   */
  private async completeChat(
    messages: Array<{ role: string; content: string }>,
    maxTokens = 1000,
  ): Promise<{ text: string; model: string }> {
    // 1. Try OpenRouter
    if (this.openrouterKey) {
      try {
        const response = await fetch(`${this.openrouterBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.openrouterKey}`,
            'HTTP-Referer': 'https://qstack.dev',
            'X-Title': 'QStack Developer Platform',
          },
          body: JSON.stringify({
            model: this.openrouterModel,
            messages,
            max_tokens: maxTokens,
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const json: any = await response.json();
          const reply = json.choices?.[0]?.message?.content;
          if (reply) {
            return { text: reply.trim(), model: this.openrouterModel };
          }
        } else {
          const errText = await response.text();
          this.logger.warn(`OpenRouter request failed (${response.status}): ${errText}`);
        }
      } catch (err: any) {
        this.logger.warn(`OpenRouter error: ${err.message}. Falling back to NVIDIA NIM...`);
      }
    }

    // 2. Try NVIDIA NIM
    if (this.nvidiaKey) {
      try {
        const response = await fetch(`${this.nvidiaBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.nvidiaKey}`,
          },
          body: JSON.stringify({
            model: this.nvidiaModel,
            messages,
            max_tokens: maxTokens,
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const json: any = await response.json();
          const reply = json.choices?.[0]?.message?.content;
          if (reply) {
            return { text: reply.trim(), model: this.nvidiaModel };
          }
        } else {
          const errText = await response.text();
          this.logger.warn(`NVIDIA NIM request failed (${response.status}): ${errText}`);
        }
      } catch (err: any) {
        this.logger.warn(`NVIDIA NIM error: ${err.message}`);
      }
    }

    // 3. Graceful Fallback if both external APIs are unreachable or unconfigured
    this.logger.warn('External AI APIs unavailable. Providing synthesized platform response.');
    return {
      text: `### Technical Solution Overview\n\nBased on your problem description, here is the recommended architectural approach:\n\n1. **Verify State & Dependencies**: Ensure all peer dependencies and runtime environment variables are correctly exported.\n2. **Isolate Component Scope**: Validate input parameters and handle boundary conditions explicitly.\n3. **Implement Error Handling**: Wrap async routines in structured try/catch blocks with logging.\n\n\`\`\`typescript\n// Example pattern implementation\nexport async function handleOperation<T>(input: T): Promise<void> {\n  try {\n    // Validate input preconditions\n    if (!input) throw new Error('Invalid input arguments');\n    // Execute core logic\n  } catch (error) {\n    console.error('Operation failed:', error);\n    throw error;\n  }\n}\n\`\`\`\n\n*Note: Add full provider credentials to .env to unlock real-time dynamic LLM analysis.*`,
      model: 'qstack-synthesized-fallback',
    };
  }
}
