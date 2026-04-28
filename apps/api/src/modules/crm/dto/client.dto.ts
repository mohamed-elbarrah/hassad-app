import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ClientStatus, BusinessType } from '@hassad/shared';

export class CreateClientDto {
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

  @IsOptional()
  @IsUUID()
  accountManager?: string;
}

export class UpdateClientDto {
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
  businessName?: string;

  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @IsOptional()
  @IsUUID()
  accountManager?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}

export class HandoverClientDto {
  @IsString()
  projectName: string;

  @IsUUID()
  managerId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
