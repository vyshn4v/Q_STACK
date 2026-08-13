import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserBanDto, UpdateUserRoleDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('stats')
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('users')
  async findUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isBanned') isBanned?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.findUsers({
      search,
      role,
      isBanned: isBanned !== undefined ? isBanned === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('users/:id/ban')
  async setUserBanStatus(
    @Param('id') targetUserId: string,
    @CurrentUser('userId') adminId: string,
    @CurrentUser('role') adminRole: string,
    @Body() dto: UpdateUserBanDto,
  ) {
    return this.adminService.setUserBanStatus(adminId, adminRole, targetUserId, dto.isBanned);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('users/:id/role')
  async setUserRole(
    @Param('id') targetUserId: string,
    @CurrentUser('userId') superAdminId: string,
    @CurrentUser('role') superAdminRole: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.setUserRole(superAdminId, superAdminRole, targetUserId, dto.role);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('content')
  async findContent(
    @Query('targetType') targetType?: 'question' | 'answer',
    @Query('status') status?: 'active' | 'soft_deleted',
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.findContent({
      targetType,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('content/:targetType/:targetId/soft-delete')
  async softDeleteContent(
    @Param('targetType') targetType: 'question' | 'answer',
    @Param('targetId') targetId: string,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.adminService.setContentStatus(adminId, targetType, targetId, 'soft_deleted');
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('content/:targetType/:targetId/restore')
  async restoreContent(
    @Param('targetType') targetType: 'question' | 'answer',
    @Param('targetId') targetId: string,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.adminService.setContentStatus(adminId, targetType, targetId, 'active');
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('observability')
  async getObservability() {
    return this.adminService.getObservability();
  }
}
