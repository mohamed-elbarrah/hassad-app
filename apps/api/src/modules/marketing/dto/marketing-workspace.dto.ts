import { IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { CampaignPlatform, CampaignStatus, MarketingStrategyStatus, TaskPriority, TaskStatus } from "@hassad/shared";
import { Type } from "class-transformer";

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

export class MarketingTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
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
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @IsOptional() @IsIn(["name", "createdAt", "startDate", "budgetTotal", "budgetSpent"]) sortBy?: "name" | "createdAt" | "startDate" | "budgetTotal" | "budgetSpent";
  @IsOptional() @IsIn(["asc", "desc"]) sortOrder?: "asc" | "desc";
}

export class MarketingCampaignKpiDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) budgetSpent?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) impressions?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) clicks?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) conversions?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) revenue?: number;
}

export class MarketingCampaignOptimizationDto {
  @IsBoolean()
  needsOptimization!: boolean;
}

export class MarketingCampaignKpiQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
