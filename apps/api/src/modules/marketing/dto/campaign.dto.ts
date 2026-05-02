import {
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  IsInt,
} from "class-validator";
import { CampaignPlatform, CampaignStatus } from "@hassad/shared";

export class CreateCampaignDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsString()
  name: string;

  @IsEnum(CampaignPlatform)
  platform: CampaignPlatform;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsNumber()
  @Min(0)
  budgetTotal: number;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CampaignPlatform)
  platform?: CampaignPlatform;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetTotal?: number;
}

export class UpdateCampaignMetricsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetSpent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  impressions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  clicks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  conversions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;
}

export class UpdateCampaignStatusDto {
  @IsEnum(CampaignStatus)
  status: CampaignStatus;
}

export class CampaignQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;
}