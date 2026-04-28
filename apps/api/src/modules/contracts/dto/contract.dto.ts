import { IsString, IsEnum, IsUUID, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { ContractType } from '@hassad/shared';

export class CreateContractDto {
  @IsUUID()
  clientId: string;

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

  @IsNumber()
  monthlyValue: number;

  @IsNumber()
  totalValue: number;

  @IsOptional()
  @IsString()
  filePath?: string;
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

export class CreateVersionDto {
  @IsString()
  filePath: string;
}
