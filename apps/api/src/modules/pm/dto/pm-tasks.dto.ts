import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { FilePurpose, TaskDepartment, TaskPriority, TaskStatus } from "@hassad/shared";

export class PmTasksQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsEnum(TaskDepartment)
  department?: TaskDepartment;

  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @IsOptional()
  @IsDateString()
  dueAfter?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class PmTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

export class PmTaskAssignDto {
  @IsUUID()
  userId!: string;
}

export class PmTaskCommentDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class PmTaskFileDto {
  @IsOptional()
  @IsEnum(FilePurpose)
  purpose?: FilePurpose;
}
