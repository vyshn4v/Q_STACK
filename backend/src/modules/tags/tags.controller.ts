import { Controller, Get, Param, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Public } from '../../common/decorators/roles.decorator';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get()
  async getTags(
    @Query('search') search?: string,
    @Query('limit') limit?: number,
  ) {
    return this.tagsService.getAllTags(search, limit ? Number(limit) : 50);
  }

  @Public()
  @Get('popular')
  async getPopularTags(@Query('limit') limit?: number) {
    return this.tagsService.getPopularTags(limit ? Number(limit) : 10);
  }

  @Public()
  @Get(':name')
  async getTagByName(@Param('name') name: string) {
    return this.tagsService.getTagByName(name);
  }
}
