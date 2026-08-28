import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { ContractStatus, ContractType } from "@hassad/shared";

export class AdminContractsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  expiringDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class AdminContractStatusDto {
  @IsEnum(ContractStatus)
  status!: ContractStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminContractActionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export interface AdminContractFileResponseDto {
  fileUrl: string | null;
}

export interface AdminContractVersionResponseDto {
  id: string;
  versionNumber: number;
  fileUrl: string | null;
  createdAt: string;
}

export class ConvertToProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  pmId?: string;
}
