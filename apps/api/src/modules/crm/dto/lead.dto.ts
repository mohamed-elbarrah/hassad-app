import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsJSON } from 'class-validator';
import { PipelineStage, BusinessType, ClientSource, ContactLogType, ContactLogResult } from '@hassad/shared';

export class CreateLeadDto {
  @IsString()
  companyName: string;

  @IsString()
  contactName: string;

  @IsString()
  phoneWhatsapp: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  businessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsEnum(ClientSource)
  source: ClientSource;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  phoneWhatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignLeadDto {
  @IsUUID()
  userId: string;
}

export class CreateContactLogDto {
  @IsEnum(ContactLogType)
  type: ContactLogType;

  @IsEnum(ContactLogResult)
  result: ContactLogResult;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ChangeLeadStageDto {
  @IsEnum(PipelineStage)
  toStage: PipelineStage;
}
