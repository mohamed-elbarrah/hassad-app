import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsArray,
  IsEnum,
  IsBoolean,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { UserRole, TaskDepartment } from "@hassad/shared";

export class QueryUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserRole)
  excludeRole?: UserRole;

  @IsOptional()
  @IsEnum(TaskDepartment)
  department?: TaskDepartment;

  @IsOptional()
  @IsString()
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

export class BulkUserActionDto {
  @IsArray()
  @IsUUID("4", { each: true })
  userIds: string[];

  @IsString()
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

export class ResetPasswordDto {
  // No body needed — password is generated server-side
}

export class AssignPermissionsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  permissionIds: string[];
}

export class ChangeRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
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
  activeProjectsCount: number;
  createdAt: string;
  updatedAt: string;
}
