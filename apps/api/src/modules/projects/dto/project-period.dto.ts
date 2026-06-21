import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  IsEnum,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";
import { MeetingStatus, type PeriodGoal } from "@hassad/shared";

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

/** PM-defined goals for a period (visible to the client portal). */
export class SavePeriodGoalsDto {
  @IsString({ each: true })
  title: string;

  goals: PeriodGoal[];
}

/** PM schedules a client meeting for a period. */
export class CreateMeetingDto {
  @IsString()
  title: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;
}

/** PM updates a meeting (reschedule, mark done, add notes, cancel). */
export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}