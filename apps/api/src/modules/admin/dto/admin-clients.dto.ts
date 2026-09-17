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
  MaxLength,
  Matches,
  IsEmail,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";
import { ClientKind, ClientStatus } from "@hassad/shared";

export class AdminCreateClientDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(/^[0-9+()\s.-]{7,30}$/)
  @Matches(/\S/)
  phoneWhatsapp!: string;

  @IsOptional()
  @IsUUID()
  accountManager?: string;
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

export class ChangeClientStatusDto {
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
