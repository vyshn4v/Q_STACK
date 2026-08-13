import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { ToggleFollowDto } from './dto/follows.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async toggleFollow(
    @CurrentUser('userId') userId: string,
    @Body() dto: ToggleFollowDto,
  ) {
    return this.followsService.toggleFollow(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getFollowStatus(
    @CurrentUser('userId') userId: string,
    @Query('targetType') targetType: 'user' | 'tag' | 'question',
    @Query('targetId') targetId: string,
  ) {
    return this.followsService.getFollowStatus(userId, targetType, targetId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('users')
  async getFollowingUsers(
    @CurrentUser('userId') currentUserId?: string,
    @Query('userId') queryUserId?: string,
  ) {
    const targetUserId = queryUserId || currentUserId;
    if (!targetUserId) return [];
    return this.followsService.getFollowingUsers(targetUserId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('tags')
  async getFollowingTags(
    @CurrentUser('userId') currentUserId?: string,
    @Query('userId') queryUserId?: string,
  ) {
    const targetUserId = queryUserId || currentUserId;
    if (!targetUserId) return [];
    return this.followsService.getFollowingTags(targetUserId);
  }
}
