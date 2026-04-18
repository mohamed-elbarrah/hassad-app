import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  IsBoolean,
} from "class-validator";
import { UserRole, TaskDepartment } from "@hassad/shared";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: "Invalid email address" })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: "role must be a valid UserRole" })
  role?: UserRole;

  @IsOptional()
  @IsEnum(TaskDepartment, {
    message: "department must be a valid TaskDepartment",
  })
  department?: TaskDepartment | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
