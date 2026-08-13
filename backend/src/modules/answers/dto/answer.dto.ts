import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @MinLength(20, { message: 'Answer must be at least 20 characters long' })
  @IsNotEmpty()
  body: string;
}

export class UpdateAnswerDto {
  @IsString()
  @MinLength(20, { message: 'Answer must be at least 20 characters long' })
  @IsNotEmpty()
  body: string;
}
