import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
    return this.usersService.getLeaderboard(limitNum);
  }

  @Public()
  @Get(':id')
  async getProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getProfile(id);
  }

  @Public()
  @Get(':id/questions')
  async getUserQuestions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10)));
    return this.usersService.getUserQuestions(id, limitNum);
  }

  @Public()
  @Get(':id/answers')
  async getUserAnswers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10)));
    return this.usersService.getUserAnswers(id, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/activity')
  async getUserActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '30', 10)));
    return this.usersService.getUserActivity(id, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
