import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsObject,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class BrandAssetsDto {
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString({ each: true })
  brandColors?: string[];

  @IsOptional()
  @IsString({ each: true })
  fonts?: string[];

  @IsOptional()
  @IsUrl()
  guidelinesUrl?: string;
}

export class UpsertClientProfileDto {
  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsNumber()
  budgetRangeMin?: number;

  @IsOptional()
  @IsNumber()
  budgetRangeMax?: number;

  @IsOptional()
  @IsString()
  communicationPreference?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  preferredPlatforms?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BrandAssetsDto)
  brandAssets?: BrandAssetsDto;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  instagramHandle?: string;

  @IsOptional()
  @IsString()
  tiktokHandle?: string;

  @IsOptional()
  @IsString()
  twitterHandle?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  snapchatHandle?: string;

  @IsOptional()
  @IsString()
  workingHours?: string;

  @IsOptional()
  @IsString()
  decisionMakerName?: string;

  @IsOptional()
  @IsString()
  decisionMakerPhone?: string;

  @IsOptional()
  @IsString()
  painPoints?: string;
}
