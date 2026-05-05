import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { BusinessType, ClientSource, RequestStatus } from "@hassad/shared";

export class RequestServiceItemDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRequestDto {
  @IsString()
  companyName: string;

  @IsString()
  contactName: string;

  @IsString()
  phoneWhatsapp: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  businessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsEnum(ClientSource)
  source: ClientSource;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  services?: RequestServiceItemDto[];
}

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  toStatus: RequestStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
