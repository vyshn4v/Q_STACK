import { Injectable, NotFoundException } from '@nestjs/common';
import { TagRow, TagsRepository } from './tags.repository';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepo: TagsRepository) {}

  async getAllTags(search?: string, limit = 50): Promise<TagRow[]> {
    return this.tagsRepo.findAll(search, limit);
  }

  async getTagByName(name: string): Promise<TagRow> {
    const tag = await this.tagsRepo.findByName(name);
    if (!tag) {
      throw new NotFoundException(`Tag '${name}' not found.`);
    }
    return tag;
  }

  async getPopularTags(limit = 10): Promise<TagRow[]> {
    return this.tagsRepo.findAll(undefined, limit);
  }
}
