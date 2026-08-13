import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}

export class SendChatMessageDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string;
}
