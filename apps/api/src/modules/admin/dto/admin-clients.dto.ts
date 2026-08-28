import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsIn,
  MinLength,
  IsEmail,
} from "class-validator";
import { Type } from "class-transformer";
import { BusinessType, ClientKind, ClientStatus } from "@hassad/shared";

export class AdminCreateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  phoneWhatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  businessName?: string;

  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @IsOptional()
  @IsUUID()
  accountManager?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class SuspendClientDto {
  @IsString()
  @MinLength(1)
  reason: string;

  @IsOptional()
  @IsDateString()
  suspendedUntil?: string;
}

export class ReactivateClientDto {
  @IsString()
  @MinLength(1)
  reason: string;
}

export class AssignManagerDto {
  @IsUUID()
  accountManagerId: string;

  @IsString()
  @MinLength(1)
  reason: string;
}

export class QueryAdminClientsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["active", "stopped", "inactive", "lead"])
  status?: "active" | "stopped" | "inactive" | "lead";

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

export class QueryAdminClientHistoryDto {
  @IsOptional()
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

/** Public activity projection; audit state snapshots must never cross this boundary. */
export interface AdminClientActivityItem {
  id: string;
  eventType: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  occurredAt: string;
}

export interface AdminClientActivityResponse {
  items: AdminClientActivityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class QueryClientUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsEnum(ClientKind)
  kind?: ClientKind;

  @IsOptional()
  @IsIn(["new", "active", "stopped"])
  segment?: "new" | "active" | "stopped";

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
