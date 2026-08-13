import { Module } from '@nestjs/common';
import { BookmarksRepository } from './bookmarks.repository';
import { BookmarksService } from './bookmarks.service';
import { BookmarksController } from './bookmarks.controller';

@Module({
  controllers: [BookmarksController],
  providers: [BookmarksRepository, BookmarksService],
  exports: [BookmarksRepository, BookmarksService],
})
export class BookmarksModule {}
