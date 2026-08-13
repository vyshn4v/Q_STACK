import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AnswersService } from './answers.service';
import { CreateAnswerDto, UpdateAnswerDto } from './dto/answer.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Public } from '../../common/decorators/roles.decorator';

@Controller()
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('questions/:questionId/answers')
  async getAnswersForQuestion(
    @Param('questionId') questionId: string,
    @CurrentUser('userId') currentUserId?: string,
  ) {
    return this.answersService.getAnswersForQuestion(questionId, currentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('questions/:questionId/answers')
  async createAnswer(
    @Param('questionId') questionId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateAnswerDto,
  ) {
    return this.answersService.createAnswer(questionId, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('answers/:id/accept')
  async acceptAnswer(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    await this.answersService.acceptAnswer(id, userId, userRole);
    return { success: true, message: 'Answer accepted as solution.' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('answers/:id')
  async updateAnswer(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: UpdateAnswerDto,
  ) {
    return this.answersService.updateAnswer(id, userId, userRole, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('answers/:id')
  async deleteAnswer(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.answersService.deleteAnswer(id, userId, userRole);
  }
}
