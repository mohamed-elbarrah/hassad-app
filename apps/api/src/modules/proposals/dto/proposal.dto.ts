import { IsString, IsNumber, IsUUID, IsArray, IsOptional } from 'class-validator';

export class CreateProposalDto {
  @IsUUID()
  leadId: string;

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
  @IsArray()
  platforms?: string[];

  @IsOptional()
  @IsString()
  filePath?: string;
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
  @IsArray()
  platforms?: string[];

  @IsOptional()
  @IsString()
  filePath?: string;
}

export class ProposalResponseDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
