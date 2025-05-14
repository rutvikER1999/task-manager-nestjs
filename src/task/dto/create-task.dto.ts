import { IsString, IsNotEmpty, Length, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 200, { message: 'Title must be between 1 and 200 characters' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Description must be at least 1 character long' })
  description: string;
} 