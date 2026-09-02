import {
  IsString,
  IsNumber,
  IsUUID,
  IsArray,
  IsOptional,
} from "class-validator";
import { Transform } from "class-transformer";

interface ProposalServiceItemDto {
  name: string;
  price: number;
  description?: string;
}

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
  servicesList?: ProposalServiceItemDto[];

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsOptional()
  @IsString()
  durationUnit?: string;
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
  servicesList?: ProposalServiceItemDto[];

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsOptional()
  @IsString()
  durationUnit?: string;
}

export class ProposalResponseDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
