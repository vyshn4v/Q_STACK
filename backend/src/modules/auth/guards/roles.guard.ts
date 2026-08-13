import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../common/enums';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

const ROLE_RANKS: Record<string, number> = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('User permissions could not be determined.');
    }

    const userRank = ROLE_RANKS[user.role] || 0;
    const minRequiredRank = Math.min(...requiredRoles.map((r) => ROLE_RANKS[r] || 99));

    const hasPermission = userRank >= minRequiredRank;

    if (!hasPermission) {
      throw new ForbiddenException('You do not have sufficient permissions to perform this action.');
    }

    return true;
  }
}
