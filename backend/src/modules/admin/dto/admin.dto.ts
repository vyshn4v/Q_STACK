import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../../common/enums';

export class UpdateUserBanDto {
  @IsNotEmpty()
  @IsBoolean()
  isBanned: boolean;
}

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsEnum(UserRole, {
    message: 'role must be one of: user, moderator, admin',
  })
  role: UserRole;
}
