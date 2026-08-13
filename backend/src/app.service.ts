import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async getHealthStatus() {
    const isDbHealthy = await this.db.ping();
    const isRedisHealthy = await this.redis.isHealthy();

    return {
      status: isDbHealthy ? 'ok' : 'degraded',
      services: {
        database: isDbHealthy ? 'up' : 'down',
        redis: isRedisHealthy ? 'up' : 'down',
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0-phase0',
    };
  }
}
