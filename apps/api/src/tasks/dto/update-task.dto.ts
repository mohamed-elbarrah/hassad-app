import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MinLength,
  Matches,
} from "class-validator";
import { TaskPriority, TaskDepartment } from "@hassad/shared";

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Task title must be at least 2 characters" })
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^c[^\s-]{8,}$/i, { message: "assignedTo must be a valid CUID" })
  assignedTo?: string;

  @IsOptional()
  @IsEnum(TaskDepartment, { message: "dept must be a valid TaskDepartment" })
  dept?: TaskDepartment;

  @IsOptional()
  @IsEnum(TaskPriority, { message: "priority must be a valid TaskPriority" })
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString({}, { message: "dueDate must be a valid ISO date string" })
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
