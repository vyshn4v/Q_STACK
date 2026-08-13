import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly nvidiaKey: string;
  private readonly nvidiaBaseUrl: string;
  private readonly embeddingModel: string;

  constructor(private readonly config: ConfigService) {
    this.nvidiaKey = this.config.get<string>('NVIDIA_NIM_API_KEY', '');
    this.nvidiaBaseUrl = this.config.get<string>('NVIDIA_NIM_BASE_URL', 'https://integrate.api.nvidia.com/v1');
    this.embeddingModel = this.config.get<string>('NVIDIA_NIM_EMBEDDING_MODEL', 'nvidia/nv-embed-v1');
  }

  /**
   * Generate dense vector embedding from text using NVIDIA NIM NV-Embed V1
   */
  async generateEmbedding(text: string, inputType: 'query' | 'passage' = 'passage'): Promise<number[] | null> {
    if (!this.nvidiaKey) {
      this.logger.warn('NVIDIA_NIM_API_KEY is not configured. Skipping embedding generation.');
      return null;
    }

    try {
      const response = await fetch(`${this.nvidiaBaseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.nvidiaKey}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: [text.slice(0, 2048)], // Clamp token length
          input_type: inputType,
          encoding_format: 'float',
        }),
      });

      if (response.ok) {
        const json: any = await response.json();
        const embedding = json.data?.[0]?.embedding;
        if (Array.isArray(embedding)) {
          return embedding;
        }
      } else {
        const err = await response.text();
        this.logger.warn(`NVIDIA NIM Embeddings failed (${response.status}): ${err}`);
      }
    } catch (err: any) {
      this.logger.error(`Error generating embeddings: ${err.message}`);
    }

    return null;
  }
}
