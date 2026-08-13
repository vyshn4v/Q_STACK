import { IsEnum, IsIn, IsNotEmpty, IsUUID } from 'class-validator';

export enum VoteTargetType {
  QUESTION = 'question',
  ANSWER = 'answer',
}

export class CastVoteDto {
  @IsEnum(VoteTargetType, { message: "targetType must be 'question' or 'answer'" })
  @IsNotEmpty()
  targetType: VoteTargetType;

  @IsUUID('4', { message: 'targetId must be a valid UUID' })
  @IsNotEmpty()
  targetId: string;

  @IsIn([1, -1], { message: 'value must be 1 (upvote) or -1 (downvote)' })
  @IsNotEmpty()
  value: 1 | -1;
}
