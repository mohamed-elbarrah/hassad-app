import { IsIn, IsOptional, IsString, IsInt, Min, Max } from "class-validator";
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
  @IsIn([
    "all",
    "sales",
    "clients",
    "projects",
    "tasks",
    "system-health",
    "finance",
  ])
  reportType: string;

  @IsString()
  @IsIn(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
}

export class SnapshotQueryDto {
  @IsOptional()
  @IsString()
  reportType?: string;

  @IsOptional()
  @IsString()
  @IsIn(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
  period?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;
}
