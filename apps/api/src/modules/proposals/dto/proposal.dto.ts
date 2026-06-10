import {
  IsString,
  IsNumber,
  IsUUID,
  IsArray,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";
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
  @Transform(({ value }) => {
    if (value == null) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  })
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
  @Transform(({ value }) => {
    if (value == null) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  })
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
  @Transform(({ value }) => {
    if (value == null) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  })
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
  @Transform(({ value }) => {
    if (value == null) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  })
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
