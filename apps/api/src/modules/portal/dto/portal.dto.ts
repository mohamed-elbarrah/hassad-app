import {
  IsString,
  IsUUID,
  IsOptional,
  IsJSON,
  IsArray,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  MaxLength,
  Min,
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
  // Section 1: Business Basics
  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetAudience?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetRangeMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetRangeMax?: number;

  // Section 2: Marketing Goals
  @IsOptional()
  @IsArray()
  campaignGoals?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  campaignOffer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  competitors?: string;

  @IsOptional()
  @IsString()
  seasonalTiming?: string;

  // Section 3: Customer Journey
  @IsOptional()
  @IsArray()
  orderMethods?: string[];

  @IsOptional()
  @IsBoolean()
  abandonedCartSystem?: boolean;

  // Section 4: Creative & Brand Assets
  @IsOptional()
  @IsBoolean()
  hasVisualIdentity?: boolean;

  @IsOptional()
  @IsJSON()
  brandAssets?: any;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  visualReferences?: string;

  @IsOptional()
  @IsArray()
  uploadedFiles?: Array<{
    key: string;
    originalName: string;
    mimeType: string;
    size?: number;
  }>;
}

export class RequestProjectRevisionDto {
  @IsString()
  comment: string;
}
