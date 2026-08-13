import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
