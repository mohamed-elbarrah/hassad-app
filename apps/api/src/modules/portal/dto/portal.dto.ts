import {
  IsString,
  IsUUID,
  IsOptional,
  IsJSON,
  IsArray,
  IsDateString,
  IsEnum,
} from "class-validator";

export enum ReportGranularity {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

export class ReportTimelineQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(ReportGranularity)
  granularity?: "day" | "week" | "month";
}

export class ReportKpiCardDto {
  metric!: string;
  label!: string;
  value!: number;
  previousValue!: number;
  trendPercent!: number | null;
}

export class ReportSmartTipDto {
  type!: "budget" | "warning" | "insight";
  title!: string;
  description!: string;
}

export class ReportTopCampaignDto {
  id!: string;
  name!: string;
  platform!: string;
  impressions!: number;
  clicks!: number;
  conversions!: number;
  conversionRate!: number;
  spend!: number;
}

export class ReportPlatformDistributionDto {
  platform!: string;
  spend!: number;
  percent!: number;
}

export class ReportTimelineDatasetDto {
  label!: string;
  data!: number[];
  metric!: string;
}

export class CreateDeliverableDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRevisionDto {
  @IsString()
  requestDescription: string;
}

export class CreateIntakeFormDto {
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsArray()
  goals?: any[];
}

export class RequestProjectRevisionDto {
  @IsString()
  comment: string;
}
