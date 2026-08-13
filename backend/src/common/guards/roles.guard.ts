import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums';

const ROLE_LEVELS: Record<string, number> = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: Authentication required with appropriate role.');
    }

    const userLevel = ROLE_LEVELS[user.role] || 0;

    // Check if user role meets minimum level of any required role
    const hasRole = requiredRoles.some((requiredRole) => {
      const requiredLevel = ROLE_LEVELS[requiredRole] || 999;
      return userLevel >= requiredLevel;
    });

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Action requires role [${requiredRoles.join(', ')}], current role is [${user.role}].`,
      );
    }

    return true;
  }
}
