import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { BusinessType, ClientSource, RequestStatus } from "@hassad/shared";

export class RequestServiceItemDto {
  @IsString()
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
  @ValidateNested({ each: true })
  @Type(() => RequestServiceItemDto)
  services?: RequestServiceItemDto[];
}

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  toStatus: RequestStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
