import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = Number(this.configService.get<number>('REDIS_PORT', 6379));
    const password = this.configService.get<string>('REDIS_PASSWORD');

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        keyPrefix: `Q_STACK`,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 5) {
            this.logger.warn('Redis retry limit reached. Redis will remain disconnected until available.');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis connection error: ${err.message}`);
      });
    } catch (error) {
      this.logger.warn(`Failed to initialize Redis client: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.logger.log('Closing Redis connection');
      await this.client.quit();
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }

  // Key-Value Cache Operations
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (err: any) {
      this.logger.warn(`Redis get error for key [${key}]: ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: any) {
      this.logger.warn(`Redis set error for key [${key}]: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.warn(`Redis del error for key [${key}]: ${err.message}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err: any) {
      this.logger.warn(`Redis delPattern error for pattern [${pattern}]: ${err.message}`);
    }
  }
}
