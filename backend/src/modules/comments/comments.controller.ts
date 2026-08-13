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
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/roles.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get()
  async getComments(
    @Query('parentType') parentType: 'question' | 'answer',
    @Query('parentId') parentId: string,
  ) {
    return this.commentsService.getComments(parentType, parentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createComment(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateComment(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(id, userId, userRole, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.commentsService.deleteComment(id, userId, userRole);
  }
}
