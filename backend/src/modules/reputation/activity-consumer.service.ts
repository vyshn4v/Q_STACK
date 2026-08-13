import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import type { IEventBus } from '../../redis/event-bus.interface';

@Injectable()
export class ActivityConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ActivityConsumerService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  async onModuleInit() {
    this.logger.log('Registering Redis Stream event consumers for Activity Logger & Daily Active...');

    // Subscribe to activity_events stream
    await this.eventBus.subscribe(
      'activity_events',
      'activity-logger-group',
      'logger-worker-1',
      async (event) => {
        await this.handleActivityEvent(event);
      },
    );

    // Subscribe to auth stream for login tracking
    await this.eventBus.subscribe(
      'auth',
      'auth-activity-group',
      'auth-worker-1',
      async (event) => {
        await this.handleAuthEvent(event);
      },
    );

    // Subscribe to votes stream
    await this.eventBus.subscribe(
      'votes',
      'votes-activity-group',
      'votes-worker-1',
      async (event) => {
        await this.handleActivityEvent(event);
      },
    );

    // Subscribe to answers stream
    await this.eventBus.subscribe(
      'answers',
      'answers-activity-group',
      'answers-worker-1',
      async (event) => {
        await this.handleActivityEvent(event);
      },
    );
  }

  async handleActivityEvent(event: any) {
    try {
      const eventType = event.type || 'unknown.event';
      const userId = event.userId || event.payload?.userId || null;
      const payload = event.payload || {};

      await this.db.query(
        `INSERT INTO activity_events (event_type, user_id, payload, created_at)
         VALUES ($1, $2, $3, $4)`,
        [eventType, userId, JSON.stringify(payload), event.timestamp || new Date()],
      );
    } catch (err: any) {
      this.logger.error(`Failed to record activity event: ${err.message}`);
    }
  }

  async handleAuthEvent(event: any) {
    try {
      await this.handleActivityEvent(event);

      if (event.type === 'user.login' && event.userId) {
        // Upsert into daily_active
        await this.db.query(
          `INSERT INTO daily_active (user_id, date)
           VALUES ($1, CURRENT_DATE)
           ON CONFLICT (user_id, date) DO NOTHING`,
          [event.userId],
        );
      }
    } catch (err: any) {
      this.logger.error(`Failed to record login activity: ${err.message}`);
    }
  }
}
