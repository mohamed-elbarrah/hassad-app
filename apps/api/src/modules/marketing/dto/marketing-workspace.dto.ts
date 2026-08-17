import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { CampaignPlatform, CampaignStatus, MarketingStrategyStatus, TaskPriority, TaskStatus } from "@hassad/shared";

export class MarketingTaskQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsDateString() dueBefore?: string;
  @IsOptional() @IsDateString() dueAfter?: string;
  @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number = 50;
}

export class MarketingStrategyQueryDto {
  @IsOptional() @IsEnum(MarketingStrategyStatus) status?: MarketingStrategyStatus;
  @IsOptional() @IsUUID() taskId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

export class MarketingCampaignQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(CampaignStatus) status?: CampaignStatus;
  @IsOptional() @IsEnum(CampaignPlatform) platform?: CampaignPlatform;
  @IsOptional() @IsUUID() taskId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

export class MarketingCampaignKpiDto {
  @IsOptional() @IsNumber() @Min(0) budgetSpent?: number;
  @IsOptional() @IsInt() @Min(0) impressions?: number;
  @IsOptional() @IsInt() @Min(0) clicks?: number;
  @IsOptional() @IsInt() @Min(0) conversions?: number;
  @IsOptional() @IsNumber() @Min(0) revenue?: number;
}
