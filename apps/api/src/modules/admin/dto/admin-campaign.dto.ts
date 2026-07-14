import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsUUID,
} from "class-validator";
import { CampaignPlatform, CampaignStatus } from "@hassad/shared";

export class AdminCreateCampaignDto {
  @IsString()
  name: string;

  @IsEnum(CampaignPlatform)
  platform: CampaignPlatform;

  @IsNumber()
  @Min(0)
  budgetTotal: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;
}

export class AdminUpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CampaignPlatform)
  platform?: CampaignPlatform;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetTotal?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
