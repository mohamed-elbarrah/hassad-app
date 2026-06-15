import { IsOptional, IsString, IsNumber, IsArray, IsObject } from "class-validator";

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
  @IsArray()
  competitors?: { name: string; url?: string; notes?: string }[];

  @IsOptional()
  @IsObject()
  brandAssets?: {
    logoUrl?: string;
    brandColors?: string[];
    fonts?: string[];
    guidelinesUrl?: string;
  };

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}
