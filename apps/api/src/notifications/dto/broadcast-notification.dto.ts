import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
} from "class-validator";
import { UserRole, TaskDepartment } from "@hassad/shared";

export class BroadcastNotificationDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  message: string;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @IsOptional()
  @IsArray()
  @IsEnum(TaskDepartment, { each: true })
  departments?: TaskDepartment[];
}
