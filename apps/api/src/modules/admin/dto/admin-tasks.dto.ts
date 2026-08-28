import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { TaskPriority, TaskStatus } from "@hassad/shared";

export class AdminTasksQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  search?: string;
  @IsOptional() @IsUUID() assigneeId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  // Departments are stored as relation IDs in the task table.
  @IsOptional() @IsUUID() department?: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return value;
  })
  @IsBoolean()
  overdueOnly?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class AdminReassignTaskDto {
  @IsUUID() assigneeId!: string;
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}

export class AdminForceTransitionDto {
  @IsEnum(TaskStatus) status!: TaskStatus;
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}
