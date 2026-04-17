import { IsString, IsEmail, IsEnum, MinLength } from "class-validator";
import { UserRole } from "@hassad/shared";

const INTERNAL_ROLES = [
  UserRole.PM,
  UserRole.SALES,
  UserRole.EMPLOYEE,
  UserRole.MARKETING,
  UserRole.ACCOUNTANT,
] as const;

export class RegisterInternalDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: (typeof INTERNAL_ROLES)[number];
}
