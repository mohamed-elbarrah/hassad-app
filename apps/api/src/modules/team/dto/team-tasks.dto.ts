import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { TaskDepartment, TaskPriority, TaskStatus, FilePurpose } from "@hassad/shared";

export class TeamTasksQueryDto {
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
  @IsEnum(TaskDepartment)
  department?: TaskDepartment;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @IsOptional()
  @IsDateString()
  dueAfter?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class TeamTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

export class TeamTaskCommentDto {
  @IsString()
  content!: string;
}

export class TeamTaskFileDto {
  @IsOptional()
  @IsEnum(FilePurpose)
  purpose?: FilePurpose;
}
