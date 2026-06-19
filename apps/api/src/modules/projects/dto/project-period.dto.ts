import { IsString, IsOptional, IsDateString, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

/** PM-authored monthly summary saved to a period. */
export class SavePeriodSummaryDto {
  @IsString()
  summary: string;
}

/** Push a period's end date out (PM extend). */
export class ExtendPeriodDto {
  @IsDateString()
  endDate: string;
}

/** PM closes a period early (before its natural end date). */
export class ClosePeriodDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

/** Recompute/override the period completion percentage. */
export class SetPeriodCompletionDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  completionPercentage: number;
}