import { IsEnum, IsOptional, IsDateString, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";
import { TaskStatus, TaskPriority, TaskDepartment } from "@hassad/shared";

export class MyTasksFiltersDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskDepartment)
  dept?: TaskDepartment;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @IsOptional()
  @IsDateString()
  dueAfter?: string;
}
