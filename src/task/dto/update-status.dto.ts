import { IsEnum } from 'class-validator';
import { TaskStatus } from '../task.schema';

export class UpdateStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
} 