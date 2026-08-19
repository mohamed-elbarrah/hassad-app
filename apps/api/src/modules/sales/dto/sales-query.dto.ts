import { Type } from "class-transformer";
import { RequestQueryDto } from "../../requests/dto/request-query.dto";
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

export class SalesPipelineQueryDto extends RequestQueryDto {
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
