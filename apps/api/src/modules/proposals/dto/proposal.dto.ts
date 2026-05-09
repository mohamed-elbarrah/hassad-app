import {
  IsString,
  IsNumber,
  IsUUID,
  IsArray,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";
import { DurationUnit } from "@hassad/shared";

export class CreateProposalDto {
  @IsUUID()
  requestId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @IsOptional()
  @IsArray()
  servicesList?: any[];

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsOptional()
  @IsString()
  durationUnit?: string;

  @IsOptional()
  @IsArray()
  platforms?: string[];

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsNumber()
  offerValidityDays?: number;
}

export class UpdateProposalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @IsOptional()
  @IsArray()
  servicesList?: any[];

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsOptional()
  @IsString()
  durationUnit?: string;

  @IsOptional()
  @IsArray()
  platforms?: string[];

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsNumber()
  offerValidityDays?: number;
}

export class ProposalResponseDto {
  @IsOptional()
  @IsString()
  notes?: string;
}