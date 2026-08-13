import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { VotesRepository } from './votes.repository';

@Module({
  controllers: [VotesController],
  providers: [VotesService, VotesRepository],
  exports: [VotesService, VotesRepository],
})
export class VotesModule {}
