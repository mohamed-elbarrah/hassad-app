import { IsString, IsEnum, IsUUID, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { TaskStatus, TaskPriority, TaskDepartment, FilePurpose } from '@hassad/shared';

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

export class CreateTaskFileDto {
  @IsString()
  filePath: string;

  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsString() // Should be number in DB but validation can be string for some reason? No, let's use number.
  fileSize: number;

  @IsEnum(FilePurpose)
  purpose: FilePurpose;
}

export class CreateTaskCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
