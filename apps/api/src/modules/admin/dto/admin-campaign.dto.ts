import { IsString, IsEnum, IsOptional, IsNumber, Min, IsDateString, IsUUID } from "class-validator";
import { CampaignPlatform } from "@hassad/shared";

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
