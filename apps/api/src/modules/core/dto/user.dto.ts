import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
  IsNotEmpty,
  Matches,
} from "class-validator";
import { UserRole, TaskDepartment } from "@hassad/shared";

const NON_WHITESPACE = /\S/;

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(NON_WHITESPACE)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsEnum(TaskDepartment)
  department?: TaskDepartment;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Matches(NON_WHITESPACE)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  phoneWhatsapp?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(TaskDepartment)
  department?: TaskDepartment | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
