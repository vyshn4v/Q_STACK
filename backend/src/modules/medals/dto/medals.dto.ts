import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

export class GiveMedalDto {
  @IsUUID()
  @IsNotEmpty()
  questionId!: string;

  @IsIn(['gold', 'silver', 'bronze'])
  @IsNotEmpty()
  tier!: 'gold' | 'silver' | 'bronze';
}
