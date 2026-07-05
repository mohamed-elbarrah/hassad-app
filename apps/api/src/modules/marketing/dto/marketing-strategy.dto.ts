import {
  IsString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
} from "class-validator";
import { MarketingStrategyStatus } from "@hassad/shared";

export class SendStrategyDto {
  // No fields — just changes status from DRAFT → SENT
}

export class ClientApproveStrategyDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ClientRequestRevisionDto {
  @IsString()
  comment: string;
}

export class StrategyQueryDto {
  @IsOptional()
  @IsEnum(MarketingStrategyStatus)
  status?: MarketingStrategyStatus;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
