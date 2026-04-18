import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
} from "class-validator";
import { UserRole, TaskDepartment } from "@hassad/shared";

export class CreateUserDto {
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  name: string;

  @IsEmail({}, { message: "Invalid email address" })
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password: string;

  @IsEnum(UserRole, { message: "role must be a valid UserRole" })
  role: UserRole;

  @IsOptional()
  @IsEnum(TaskDepartment, {
    message: "department must be a valid TaskDepartment",
  })
  department?: TaskDepartment;
}
