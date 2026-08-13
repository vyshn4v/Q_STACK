import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { AppEvent, IEventBus } from './event-bus.interface';

@Injectable()
export class RedisEventBusService implements IEventBus {
  private readonly logger = new Logger(RedisEventBusService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Publish an event to a Redis Stream topic.
   */
  async publish<T = any>(topic: string, event: AppEvent<T>): Promise<string | null> {
    const client = this.redisService.getClient();
    if (!client) {
      this.logger.warn(`Cannot publish to '${topic}': Redis client not connected.`);
      return null;
    }

    try {
      const payloadString = JSON.stringify(event);
      const messageId = await client.xadd(
        `stream:${topic}`,
        '*',
        'event',
        payloadString,
      );
      this.logger.debug(`Published event ${event.type} to stream:${topic} with ID ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Failed to publish event to stream:${topic}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Subscribe to a Redis Stream topic using consumer groups.
   */
  async subscribe<T = any>(
    topic: string,
    consumerGroup: string,
    consumerName: string,
    handler: (event: AppEvent<T>) => Promise<void> | void,
  ): Promise<void> {
    const client = this.redisService.getClient();
    if (!client) {
      this.logger.warn(`Cannot subscribe to '${topic}': Redis client not connected.`);
      return;
    }

    const streamKey = `stream:${topic}`;

    // Create consumer group if not already existing
    try {
      await client.xgroup('CREATE', streamKey, consumerGroup, '$', 'MKSTREAM');
      this.logger.log(`Created consumer group '${consumerGroup}' on stream '${streamKey}'`);
    } catch (error: any) {
      if (!error.message.includes('BUSYGROUP')) {
        this.logger.error(`Error creating consumer group: ${error.message}`);
      }
    }

    // Start background polling loop for the consumer
    this.startConsumerLoop(streamKey, consumerGroup, consumerName, handler);
  }

  private async startConsumerLoop<T>(
    streamKey: string,
    consumerGroup: string,
    consumerName: string,
    handler: (event: AppEvent<T>) => Promise<void> | void,
  ): Promise<void> {
    const client = this.redisService.getClient();
    if (!client) return;

    const poll = async () => {
      try {
        const response: any = await client.xreadgroup(
          'GROUP',
          consumerGroup,
          consumerName,
          'COUNT',
          10,
          'BLOCK',
          2000,
          'STREAMS',
          streamKey,
          '>',
        );

        if (response && response.length > 0) {
          const [_key, messages] = response[0];
          for (const [messageId, fields] of messages) {
            const rawEvent = fields[1];
            try {
              const parsedEvent: AppEvent<T> = JSON.parse(rawEvent);
              await handler(parsedEvent);
              await client.xack(streamKey, consumerGroup, messageId);
            } catch (handleErr) {
              this.logger.error(`Error processing message ${messageId}: ${(handleErr as Error).message}`);
            }
          }
        }
      } catch (err: any) {
        // Avoid spamming logs if redis is temporarily unavailable
        if (!err.message?.includes('Connection is closed')) {
          this.logger.warn(`Redis stream polling error for ${streamKey}: ${err.message}`);
        }
      }

      // Schedule next poll cycle
      setTimeout(poll, 100);
    };

    // Begin loop asynchronously
    setTimeout(poll, 500);
  }
}
