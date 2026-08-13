import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @MinLength(10, { message: 'Title must be at least 10 characters long' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  @IsNotEmpty()
  title: string;

  @IsString()
  @MinLength(20, { message: 'Body must be at least 20 characters long' })
  @IsNotEmpty()
  body: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Please provide at least one tag' })
  @ArrayMaxSize(5, { message: 'You can specify at most 5 tags' })
  @IsString({ each: true })
  tags: string[];
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  body?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  tags?: string[];
}

export class QueryQuestionsDto {
  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'votes' | 'unanswered' | 'trending';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
