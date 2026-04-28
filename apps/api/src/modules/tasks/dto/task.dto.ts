import {
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { TaskPriority, TaskDepartment, FilePurpose } from '@hassad/shared';

export class CreateTaskDto {
  @IsUUID()
  projectId: string;

  @IsEnum(TaskDepartment)
  dept: TaskDepartment;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsBoolean()
  isVisibleToClient?: boolean;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  isVisibleToClient?: boolean;
}

export class AssignTaskDto {
  @IsUUID()
  userId: string;
}

export class UploadTaskFileDto {
  @IsOptional()
  @IsEnum(FilePurpose)
  purpose?: FilePurpose;
}

export class TaskFileResponseDto {
  @IsString()
  id: string;

  @IsString()
  taskId: string;

  @IsString()
  uploadedBy: string;

  @IsString()
  fileName: string;

  @IsString()
  filePath: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  mimeType: string;

  @IsDateString()
  createdAt: string;
}

export class CreateTaskCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
