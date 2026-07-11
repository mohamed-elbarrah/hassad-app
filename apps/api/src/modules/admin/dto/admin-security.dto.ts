import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from "class-validator";
import { Type } from "class-transformer";

export enum SecurityEventTypeFilter {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  PASSWORD_RESET = "PASSWORD_RESET",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  IMPERSONATION = "IMPERSONATION",
  TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED = "TWO_FACTOR_DISABLED",
  SESSION_REVOKED = "SESSION_REVOKED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",
  ROLE_CHANGED = "ROLE_CHANGED",
  PERMISSION_GRANTED = "PERMISSION_GRANTED",
  PERMISSION_REVOKED = "PERMISSION_REVOKED",
}

export class QuerySecurityEventsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(SecurityEventTypeFilter)
  type?: SecurityEventTypeFilter;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

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

export class SecurityEventResponse {
  id: string;
  userId: string | null;
  userName: string | null;
  type: string;
  ip: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
}
