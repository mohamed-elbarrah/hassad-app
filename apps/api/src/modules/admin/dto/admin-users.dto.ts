import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsArray,
  ArrayUnique,
  IsEnum,
  IsBoolean,
  IsEmail,
  IsIn,
  IsDateString,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { UserRole, TaskDepartment } from "@hassad/shared";

export class QueryUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  roles?: string;

  @IsOptional()
  @IsEnum(UserRole)
  excludeRole?: UserRole;

  @IsOptional()
  @IsEnum(TaskDepartment)
  department?: TaskDepartment;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class QueryUserActivityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class BulkUserActionDto {
  @IsArray()
  @IsUUID("4", { each: true })
  userIds: string[];

  @IsIn(["activate", "deactivate", "changeRole", "reassignDepartment", "export"])
  action:
    | "activate"
    | "deactivate"
    | "changeRole"
    | "reassignDepartment"
    | "export";

  @IsOptional()
  @IsString()
  value?: string;
}

export class ImpersonateDto {
  @IsString()
  @MinLength(1)
  reason: string;
}

export class SuspendUserDto {
  @IsString()
  @MinLength(1)
  reason: string;

  @IsOptional()
  @IsDateString()
  suspendedUntil?: string;
}

export class ReactivateUserDto {
  @IsString()
  @MinLength(1)
  reason: string;
}

export class ResetPasswordDto {
  // No body needed — password is generated server-side
}

export class AssignPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  permissionIds: string[];
}

export class ChangeRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneWhatsapp?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(TaskDepartment)
  department?: TaskDepartment;
}

export class CreateAdminUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  phoneWhatsapp?: string;

  @IsOptional()
  @IsEnum(TaskDepartment)
  department?: TaskDepartment;
}

export class UserDetailResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department: string | null;
  phoneWhatsapp: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  activeRequestsCount: number;
  activeTasksCount: number;
  activeProjectsCount: number;
  createdAt: string;
  updatedAt: string;
}
