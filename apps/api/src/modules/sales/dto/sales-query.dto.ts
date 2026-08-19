import { Type } from "class-transformer";
import type { RequestPipelineGroup } from "../../requests/request-workflow";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class SalesPipelineQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsIn(["board", "table"])
  view?: "board" | "table";

  @IsOptional()
  @IsString()
  @IsIn(["INTAKE", "PROPOSAL", "CONTRACT", "WON", "CANCELLED"])
  statusGroup?: RequestPipelineGroup;
}

export class SalesPeriodQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @IsIn(["last7days", "last30days", "lastYear", "week", "month", "quarter"])
  period?: string;
}

export class SalesActivityQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
