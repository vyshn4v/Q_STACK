import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisEventBusService } from './event-bus.service';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'IEventBus',
      useClass: RedisEventBusService,
    },
    RedisEventBusService,
  ],
  exports: [RedisService, 'IEventBus', RedisEventBusService],
})
export class RedisModule {}
