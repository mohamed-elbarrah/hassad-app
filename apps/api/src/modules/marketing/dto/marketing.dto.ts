import { IsString, IsEnum, IsUUID, IsDateString, IsNumber, IsOptional, IsArray } from 'class-validator';
import { CampaignPlatform, CampaignStatus, DataSource, AbTestElement, AbTestStatus } from '@hassad/shared';

export class CreateCampaignDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsUUID()
  managedBy: string;

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
  budgetTotal: number;
}

export class CreateKpiSnapshotDto {
  @IsDateString()
  snapshotDate: string;

  @IsNumber()
  impressions: number;

  @IsNumber()
  clicks: number;

  @IsNumber()
  messagesReceived: number;

  @IsNumber()
  ordersCount: number;

  @IsNumber()
  leadsCount: number;

  @IsEnum(DataSource)
  dataSource: DataSource;
}

export class CreateAbTestDto {
  @IsString()
  name: string;

  @IsEnum(AbTestElement)
  testElement: AbTestElement;

  @IsArray()
  variants: any[];
}
