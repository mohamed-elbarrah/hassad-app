import {
  IsString,
  IsUUID,
  IsOptional,
  IsObject,
  IsArray,
  IsDateString,
  IsDefined,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsInt,
  IsNotEmpty,
  Matches,
  ValidateNested,
  MaxLength,
  MinLength,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { BusinessType, ProjectStatus } from "@hassad/shared";

export enum ReportGranularity {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

export enum SnoozeActionItemType {
  DELIVERABLE_APPROVAL = "DELIVERABLE_APPROVAL",
  INVOICE_PAYMENT = "INVOICE_PAYMENT",
  PROPOSAL_REVIEW = "PROPOSAL_REVIEW",
  CONTRACT_SIGN = "CONTRACT_SIGN",
  STRATEGY_REVIEW = "STRATEGY_REVIEW",
}

export class SnoozeActionItemDto {
  @IsEnum(SnoozeActionItemType)
  itemType: SnoozeActionItemType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  itemId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  hours?: number;
}

export class PortalProjectsQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 6;
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

export class IntakeCommunicationInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;
}

export class RequiredIntakeCommunicationInfoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Matches(/\S/)
  businessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/\S/)
  industry: string;
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
  @IsObject()
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

  // V2: New JSON sections (all optional except business identity)
  @IsOptional()
  @IsNumber()
  currentStep?: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => RequiredIntakeCommunicationInfoDto)
  communicationInfo: RequiredIntakeCommunicationInfoDto;

  @IsOptional()
  @IsObject()
  productInfo?: any;

  @IsOptional()
  @IsObject()
  audienceInfo?: any;

  @IsOptional()
  @IsObject()
  brandVoice?: any;

  @IsOptional()
  @IsObject()
  customerJourney?: any;

  @IsOptional()
  @IsObject()
  campaignInfo?: any;

  @IsOptional()
  @IsObject()
  pastPerformance?: any;

  @IsOptional()
  @IsObject()
  budgetInfo?: any;

  @IsOptional()
  @IsObject()
  visualIdentityInfo?: any;
}

export class SaveDraftDto {
  @IsOptional()
  @IsNumber()
  currentStep?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => IntakeCommunicationInfoDto)
  communicationInfo?: IntakeCommunicationInfoDto;

  @IsOptional()
  @IsObject()
  productInfo?: any;

  @IsOptional()
  @IsObject()
  audienceInfo?: any;

  @IsOptional()
  @IsObject()
  brandVoice?: any;

  @IsOptional()
  @IsObject()
  customerJourney?: any;

  @IsOptional()
  @IsObject()
  campaignInfo?: any;

  @IsOptional()
  @IsObject()
  pastPerformance?: any;

  @IsOptional()
  @IsObject()
  budgetInfo?: any;

  @IsOptional()
  @IsObject()
  visualIdentityInfo?: any;
}

export class RequestProjectRevisionDto {
  @IsString()
  comment: string;
}
