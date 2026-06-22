import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  IsUUID,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { DisputeStatus, DisputeCategory, DisputePriority } from "@hassad/shared";

export class UpdateDisputeDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;
}

export class DisputeFilterDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsEnum(DisputeCategory)
  category?: DisputeCategory;

  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  pmId?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

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

export class ApproveDisputeDto {
  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority = DisputePriority.NORMAL;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class RejectDisputeDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

export class CloseDisputeDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  resolution: string;
}

export class ChangePmDto {
  @IsUUID()
  newPmId: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

export class PmResolveDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;
}

export class ClientConfirmDto {
  @IsBoolean()
  confirmed: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  feedback?: string;
}