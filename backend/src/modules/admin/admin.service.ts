import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { DatabaseService } from '../../database/database.service';
import { UserRole } from '../../common/enums';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly db: DatabaseService,
  ) {}

  async getPlatformStats() {
    return this.adminRepo.getPlatformStats();
  }

  async findUsers(params: {
    search?: string;
    role?: string;
    isBanned?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    return this.adminRepo.findUsers({
      search: params.search,
      role: params.role,
      isBanned: params.isBanned,
      page,
      limit,
    });
  }

  async setUserBanStatus(
    adminId: string,
    adminRole: string,
    targetUserId: string,
    isBanned: boolean,
  ) {
    if (adminId === targetUserId) {
      throw new BadRequestException('Administrators cannot ban their own account.');
    }

    // Check target user role
    const targetUser = await this.db.query<{ role: string }>(
      `SELECT role FROM users WHERE id = $1`,
      [targetUserId],
    );
    if (targetUser.rows.length === 0) {
      throw new NotFoundException('User not found.');
    }

    const targetRole = targetUser.rows[0].role;
    if (targetRole === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Administrator account cannot be banned.');
    }

    if (targetRole === UserRole.ADMIN && adminRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the Super Administrator can ban another Administrator.');
    }

    const updated = await this.adminRepo.setUserBanStatus(targetUserId, isBanned);
    this.logger.log(`User ${targetUserId} ban status set to ${isBanned} by admin ${adminId}`);
    return { success: updated, userId: targetUserId, isBanned };
  }

  async setUserRole(
    superAdminId: string,
    superAdminRole: string,
    targetUserId: string,
    newRole: UserRole,
  ) {
    if (superAdminRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the Super Administrator can manually modify user roles.');
    }

    if (newRole === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('There can only ever be exactly one Super Administrator.');
    }

    const validRoles = [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(`Invalid role specified: ${newRole}`);
    }

    const updated = await this.adminRepo.setUserRole(targetUserId, newRole);
    this.logger.log(`User ${targetUserId} role updated to ${newRole} by super admin ${superAdminId}`);
    return { success: updated, userId: targetUserId, newRole };
  }

  async findContent(params: {
    targetType?: 'question' | 'answer';
    status?: 'active' | 'soft_deleted';
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    return this.adminRepo.findContent({
      targetType: params.targetType,
      status: params.status,
      search: params.search,
      page,
      limit,
    });
  }

  async setContentStatus(
    adminId: string,
    targetType: 'question' | 'answer',
    targetId: string,
    status: 'active' | 'soft_deleted',
  ) {
    const updated = await this.adminRepo.setContentStatus(targetType, targetId, status);
    if (!updated) {
      throw new NotFoundException(`The specified ${targetType} was not found.`);
    }
    this.logger.log(`${targetType} ${targetId} status changed to ${status} by admin ${adminId}`);
    return { success: true, targetType, targetId, status };
  }

  async getObservability() {
    const cronRuns = await this.db.query(
      `SELECT id, job_name, started_at, completed_at, status, events_processed, metadata
       FROM cron_runs
       ORDER BY started_at DESC
       LIMIT 10`,
    );

    const activityCounts = await this.db.query(
      `SELECT event_type, COUNT(*)::int AS count
       FROM activity_events
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY event_type
       ORDER BY count DESC`,
    );

    return {
      database: { status: 'healthy', poolSize: 10 },
      recentCronRuns: cronRuns.rows,
      activityMetrics24h: activityCounts.rows,
    };
  }
}
