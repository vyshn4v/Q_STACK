import { IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export enum CommentParentType {
  QUESTION = 'question',
  ANSWER = 'answer',
}

export class CreateCommentDto {
  @IsEnum(CommentParentType, { message: "parentType must be either 'question' or 'answer'" })
  @IsNotEmpty()
  parentType: CommentParentType;

  @IsUUID('4', { message: 'parentId must be a valid UUID' })
  @IsNotEmpty()
  parentId: string;

  @IsString()
  @MinLength(5, { message: 'Comment must be at least 5 characters long' })
  @MaxLength(1000, { message: 'Comment cannot exceed 1000 characters' })
  @IsNotEmpty()
  body: string;
}

export class UpdateCommentDto {
  @IsString()
  @MinLength(5, { message: 'Comment must be at least 5 characters long' })
  @MaxLength(1000, { message: 'Comment cannot exceed 1000 characters' })
  @IsNotEmpty()
  body: string;
}
