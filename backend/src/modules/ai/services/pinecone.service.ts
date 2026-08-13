import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: {
    questionId?: string;
    title?: string;
    snippet?: string;
    tags?: string[];
    contentType?: string;
  };
}

@Injectable()
export class PineconeService implements OnModuleInit {
  private readonly logger = new Logger(PineconeService.name);
  private readonly apiKey: string;
  private readonly indexName: string;
  private indexHost: string | null = null;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('PINECONE_API_KEY', '');
    this.indexName = this.config.get<string>('PINECONE_INDEX', 'q-stack');
  }

  async onModuleInit() {
    if (this.apiKey) {
      await this.resolveIndexHost();
    }
  }

  private async resolveIndexHost(): Promise<string | null> {
    if (this.indexHost) return this.indexHost;
    if (!this.apiKey) return null;

    try {
      const response = await fetch(`https://api.pinecone.io/indexes/${this.indexName}`, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'X-Pinecone-API-Version': '2024-07',
        },
      });

      if (response.ok) {
        const json: any = await response.json();
        if (json.host) {
          this.indexHost = `https://${json.host}`;
          this.logger.log(`Pinecone index host resolved: ${this.indexHost}`);
          return this.indexHost;
        }
      } else {
        const err = await response.text();
        this.logger.warn(`Pinecone describe_index failed (${response.status}): ${err}`);
      }
    } catch (err: any) {
      this.logger.warn(`Could not resolve Pinecone host: ${err.message}`);
    }

    return null;
  }

  /**
   * Upsert vector into Pinecone index
   */
  async upsertVector(id: string, vector: number[], metadata: Record<string, any>): Promise<boolean> {
    const host = await this.resolveIndexHost();
    if (!host || !this.apiKey) {
      this.logger.debug('Pinecone not configured or host unreachable. Skipping vector upsert.');
      return false;
    }

    try {
      const response = await fetch(`${host}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          vectors: [
            {
              id,
              values: vector,
              metadata,
            },
          ],
        }),
      });

      if (response.ok) {
        this.logger.debug(`Upserted vector ${id} to Pinecone index`);
        return true;
      } else {
        const err = await response.text();
        this.logger.warn(`Pinecone upsert failed: ${err}`);
      }
    } catch (err: any) {
      this.logger.error(`Error upserting vector to Pinecone: ${err.message}`);
    }

    return false;
  }

  /**
   * Query Pinecone index for similar technical posts
   */
  async querySimilar(vector: number[], topK = 4): Promise<VectorSearchResult[]> {
    const host = await this.resolveIndexHost();
    if (!host || !this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${host}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          vector,
          topK,
          includeMetadata: true,
        }),
      });

      if (response.ok) {
        const json: any = await response.json();
        const matches = json.matches || [];
        return matches.map((m: any) => ({
          id: m.id,
          score: m.score,
          metadata: m.metadata || {},
        }));
      } else {
        const err = await response.text();
        this.logger.warn(`Pinecone query failed: ${err}`);
      }
    } catch (err: any) {
      this.logger.error(`Error querying Pinecone: ${err.message}`);
    }

    return [];
  }
}
