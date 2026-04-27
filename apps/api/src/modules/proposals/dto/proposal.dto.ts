import { IsString, IsNumber, IsUUID, IsArray, IsOptional, IsJSON } from 'class-validator';

export class CreateProposalDto {
  @IsUUID()
  leadId: string;

  @IsString()
  title: string;

  @IsString()
  serviceDescription: string;

  @IsArray()
  servicesList: any[]; // JSON array

  @IsNumber()
  totalPrice: number;

  @IsNumber()
  durationDays: number;

  @IsArray()
  platforms: string[]; // JSON array
}
