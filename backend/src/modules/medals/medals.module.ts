import { Module } from '@nestjs/common';
import { MedalsRepository } from './medals.repository';
import { MedalsService } from './medals.service';
import { MedalsController } from './medals.controller';

@Module({
  controllers: [MedalsController],
  providers: [MedalsRepository, MedalsService],
  exports: [MedalsRepository, MedalsService],
})
export class MedalsModule {}
