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
import { Type, Transform } from "class-transformer";
import {
  DisputeStatus,
  DisputeCategory,
  DisputePriority,
} from "@hassad/shared";

/** Transform empty strings to undefined for optional enum fields */
const EmptyToUndefined = () =>
  Transform(({ value }) =>
    value === "" || value === null ? undefined : value,
  );

export class UpdateDisputeDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;
}

export class DisputeFilterDto {
  @EmptyToUndefined()
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @EmptyToUndefined()
  @IsOptional()
  @IsEnum(DisputeCategory)
  category?: DisputeCategory;

  @EmptyToUndefined()
  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;

  @IsOptional()
  @IsString()
  search?: string;

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
