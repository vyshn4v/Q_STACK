import { Injectable, NotFoundException } from '@nestjs/common';
import { UserProfile, UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getUserProfile(id: string): Promise<UserProfile> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return user;
  }

  async getLeaderboard(limit = 20): Promise<UserProfile[]> {
    return this.usersRepo.findLeaderboard(limit);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    await this.usersRepo.updateProfile(userId, dto.displayName, dto.bio, dto.avatarUrl);
    return this.getUserProfile(userId);
  }
}
