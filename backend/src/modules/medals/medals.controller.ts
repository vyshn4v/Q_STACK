import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MedalsService } from './medals.service';
import { GiveMedalDto } from './dto/medals.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('medals')
export class MedalsController {
  constructor(private readonly medalsService: MedalsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async giveMedal(
    @CurrentUser('userId') userId: string,
    @Body() dto: GiveMedalDto,
  ) {
    return this.medalsService.giveMedal(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':questionId')
  async removeMedal(
    @CurrentUser('userId') userId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return this.medalsService.removeMedal(userId, questionId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('question/:questionId')
  async getQuestionMedals(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.medalsService.getQuestionMedals(questionId, userId);
  }
}
