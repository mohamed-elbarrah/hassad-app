import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class KpiQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

export class SnapshotGenerateDto {
  @IsString()
  reportType: string;

  @IsString()
  period: "DAILY" | "WEEKLY" | "MONTHLY";
}

export class SnapshotQueryDto {
  @IsOptional()
  @IsString()
  reportType?: string;

  @IsOptional()
  @IsString()
  period?: "DAILY" | "WEEKLY" | "MONTHLY";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;
}
