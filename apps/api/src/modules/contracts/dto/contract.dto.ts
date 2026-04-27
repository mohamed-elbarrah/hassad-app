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

export class CreateVersionDto {
  @IsString()
  filePath: string;
}
