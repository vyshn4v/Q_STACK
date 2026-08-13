import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':questionId')
  async toggleBookmark(
    @CurrentUser('userId') userId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return this.bookmarksService.toggleBookmark(userId, questionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:questionId')
  async getBookmarkStatus(
    @CurrentUser('userId') userId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return this.bookmarksService.isBookmarked(userId, questionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserBookmarks(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10)));
    return this.bookmarksService.getUserBookmarks(userId, pageNum, limitNum);
  }
}
