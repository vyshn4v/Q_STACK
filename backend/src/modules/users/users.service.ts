import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getProfile(id: string) {
    const profile = await this.usersRepo.findById(id);
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return profile;
  }

  async getLeaderboard(limit = 20) {
    return this.usersRepo.findLeaderboard(limit);
  }

  async getUserQuestions(userId: string, limit = 20) {
    return this.usersRepo.getUserQuestions(userId, limit);
  }

  async getUserAnswers(userId: string, limit = 20) {
    return this.usersRepo.getUserAnswers(userId, limit);
  }

  async getUserActivity(userId: string, limit = 30) {
    return this.usersRepo.getUserActivity(userId, limit);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.usersRepo.updateProfile(
      userId,
      dto.displayName,
      dto.bio,
      dto.avatarUrl,
    );
    return this.getProfile(userId);
  }
}
