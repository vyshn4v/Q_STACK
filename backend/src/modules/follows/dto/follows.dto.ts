import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

export class ToggleFollowDto {
  @IsIn(['user', 'tag', 'question'])
  @IsNotEmpty()
  targetType!: 'user' | 'tag' | 'question';

  @IsUUID()
  @IsNotEmpty()
  targetId!: string;
}
