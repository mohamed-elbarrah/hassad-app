import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
  Max,
  Min,
} from "class-validator";
import { ProjectMemberRole, ProjectStatus, TaskPriority, TaskStatus } from "@hassad/shared";
import { Transform } from "class-transformer";

export class AdminProjectsQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() pmId?: string;
  @IsOptional() @IsUUID() clientId?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  overdueOnly?: boolean;
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class AdminProjectActionDto {
  @IsString() @IsNotEmpty() reason!: string;
}

export class AdminProjectReassignDto {
  @IsUUID() pmUserId!: string;
  @IsOptional() @IsString() reason?: string;
}

export class AdminProjectStatusDto {
  @IsEnum(ProjectStatus) status!: ProjectStatus;
  @IsOptional() @IsString() reason?: string;
}

export class AdminProjectMemberDto {
  @IsUUID() userId!: string;
  @IsEnum(ProjectMemberRole) role!: ProjectMemberRole;
  @IsOptional() @IsString() reason?: string;
}

export class AdminProjectTaskDto {
  @IsString() title!: string;
  @IsOptional() @IsUUID() assigneeId?: string;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
}

export class AdminProjectDeliverablesQueryDto {
  @IsOptional() @IsString() status?: string;
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class AdminProjectTasksQueryDto {
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class AdminCreateProjectDto {
  @IsString() name!: string;
  @IsUUID() clientId!: string;
  @IsOptional() @IsUUID() projectManagerId?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
}
