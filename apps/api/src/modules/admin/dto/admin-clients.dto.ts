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
} from "class-validator";
import { Type } from "class-transformer";
import { ClientKind, ClientStatus } from "@hassad/shared";

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
