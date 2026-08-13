import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import {
  CreateQuestionDto,
  QueryQuestionsDto,
  UpdateQuestionDto,
} from './dto/question.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Public } from '../../common/decorators/roles.decorator';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async getQuestions(
    @Query() query: QueryQuestionsDto,
    @CurrentUser('userId') currentUserId?: string,
  ) {
    return this.questionsService.getQuestions(query, currentUserId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getQuestionById(
    @Param('id') id: string,
    @CurrentUser('userId') currentUserId?: string,
  ) {
    return this.questionsService.getQuestionById(id, currentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createQuestion(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.createQuestion(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateQuestion(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.updateQuestion(id, userId, userRole, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteQuestion(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.questionsService.deleteQuestion(id, userId, userRole);
  }
}
