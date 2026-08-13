import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  @IsEnum(['question', 'answer', 'comment', 'user'], {
    message: 'targetType must be one of: question, answer, comment, user',
  })
  targetType: 'question' | 'answer' | 'comment' | 'user';

  @IsNotEmpty()
  @IsString()
  targetId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason: string;
}

export class EscalateReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  escalationReason?: string;
}

export class ResolveReportDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  actionTaken: string;
}
