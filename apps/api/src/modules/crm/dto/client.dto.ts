import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ClientStatus } from '@hassad/shared';

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
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
