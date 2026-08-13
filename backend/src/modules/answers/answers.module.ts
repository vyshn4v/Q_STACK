import { Module } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { AnswersRepository } from './answers.repository';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [QuestionsModule],
  controllers: [AnswersController],
  providers: [AnswersService, AnswersRepository],
  exports: [AnswersService, AnswersRepository],
})
export class AnswersModule {}
