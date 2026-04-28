import {
  IsString,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ContractType } from '@hassad/shared';

export class CreateContractDto {
  /** Lead whose associated Client will own this contract */
  @IsUUID()
  leadId: string;

  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @IsString()
  title: string;

  @IsEnum(ContractType)
  type: ContractType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  /** Sent as multipart text; @Transform converts to number */
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  monthlyValue: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  totalValue: number;
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  monthlyValue?: number;

  @IsOptional()
  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @IsString()
  filePath?: string;
}

/** Used by authenticated SALES to sign a specific contract by ID */
export class SignContractDto {
  @IsString()
  signedByName: string;

  @IsOptional()
  @IsString()
  signedByEmail?: string;

  @IsOptional()
  @IsString()
  signatureUrl?: string;
}

/** Used by the CLIENT via the public share link */
export class SignByTokenDto {
  @IsString()
  signedByName: string;

  @IsOptional()
  @IsString()
  signedByEmail?: string;
}

export class CreateVersionDto {
  @IsString()
  filePath: string;
}
