import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { AppEvent, IEventBus } from './event-bus.interface';

@Injectable()
export class RedisEventBusService implements IEventBus {
  private readonly logger = new Logger(RedisEventBusService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Helper to ensure the stream and its consumer group exist before reading.
   * Self-heals if the stream or consumer group was never created or flushed.
   */
  private async ensureConsumerGroup(streamKey: string, consumerGroup: string): Promise<boolean> {
    const client = this.redisService.getClient();
    if (!client) return false;

    try {
      // 1. Try creating consumer group with MKSTREAM (creates stream automatically if absent)
      await client.xgroup('CREATE', streamKey, consumerGroup, '$', 'MKSTREAM');
      this.logger.log(`Created consumer group '${consumerGroup}' on stream '${streamKey}'`);
      return true;
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('BUSYGROUP')) {
        // Group already exists, which is normal and expected
        return true;
      }

      // 2. Fallback: explicitly seed the stream if MKSTREAM failed or is not supported
      try {
        await client.xadd(streamKey, '*', 'init', '1');
        await client.xgroup('CREATE', streamKey, consumerGroup, '0');
        this.logger.log(`Initialized stream and created consumer group '${consumerGroup}' on '${streamKey}'`);
        return true;
      } catch (fallbackError: any) {
        const fMsg = fallbackError?.message || '';
        if (fMsg.includes('BUSYGROUP')) {
          return true;
        }
        this.logger.warn(`Could not create consumer group '${consumerGroup}' on '${streamKey}': ${fMsg}`);
        return false;
      }
    }
  }

  /**
   * Publish an event to a Redis Stream topic.
   */
  async publish<T = any>(topic: string, event: AppEvent<T>): Promise<string | null> {
    const client = this.redisService.getClient();
    if (!client) {
      this.logger.warn(`Cannot publish to '${topic}': Redis client not connected.`);
      return null;
    }

    const streamKey = `stream:${topic}`;

    try {
      const payloadString = JSON.stringify(event);
      const messageId = await client.xadd(
        streamKey,
        '*',
        'event',
        payloadString,
      );
      this.logger.debug(`Published event ${event.type} to ${streamKey} with ID ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Failed to publish event to ${streamKey}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Subscribe to a Redis Stream topic using consumer groups with auto self-healing.
   */
  async subscribe<T = any>(
    topic: string,
    consumerGroup: string,
    consumerName: string,
    handler: (event: AppEvent<T>) => Promise<void> | void,
  ): Promise<void> {
    const streamKey = `stream:${topic}`;

    // Ensure consumer group exists before starting listener loop
    await this.ensureConsumerGroup(streamKey, consumerGroup);

    // Start background polling loop for the consumer
    this.startConsumerLoop(streamKey, consumerGroup, consumerName, handler);
  }

  private async startConsumerLoop<T>(
    streamKey: string,
    consumerGroup: string,
    consumerName: string,
    handler: (event: AppEvent<T>) => Promise<void> | void,
  ): Promise<void> {
    const poll = async () => {
      const client = this.redisService.getClient();
      if (!client) {
        setTimeout(poll, 2000);
        return;
      }

      let nextDelay = 100;

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
            // Fields is an array of [key, val, key, val] or [key, val]
            let rawEvent: string | null = null;
            for (let i = 0; i < fields.length; i += 2) {
              if (fields[i] === 'event') {
                rawEvent = fields[i + 1];
                break;
              }
            }

            if (rawEvent) {
              try {
                const parsedEvent: AppEvent<T> = JSON.parse(rawEvent);
                await handler(parsedEvent);
                await client.xack(streamKey, consumerGroup, messageId);
              } catch (handleErr) {
                this.logger.error(`Error processing message ${messageId}: ${(handleErr as Error).message}`);
              }
            } else if (fields[0] === 'init') {
              // Acknowledge dummy initialization seed message
              await client.xack(streamKey, consumerGroup, messageId).catch(() => {});
            }
          }
        }
      } catch (err: any) {
        const errMsg = err?.message || '';
        if (errMsg.includes('NOGROUP') || errMsg.includes('no such key')) {
          // Self-heal: recreate consumer group when Redis key was missing or reset
          this.logger.log(`Stream or consumer group missing for '${streamKey}', self-healing group '${consumerGroup}'...`);
          await this.ensureConsumerGroup(streamKey, consumerGroup);
          nextDelay = 1500;
        } else if (errMsg.includes('Connection is closed') || errMsg.includes('connection is closed')) {
          nextDelay = 3000;
        } else {
          this.logger.warn(`Redis stream polling error for ${streamKey}: ${errMsg}`);
          nextDelay = 2000;
        }
      }

      // Schedule next poll cycle
      setTimeout(poll, nextDelay);
    };

    // Initial group setup and delayed startup loop
    setTimeout(poll, 600);
  }
}
