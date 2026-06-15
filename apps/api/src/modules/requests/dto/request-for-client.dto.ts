import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class RequestServiceItemDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRequestForClientDto {
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  @IsNotEmpty()
  services: RequestServiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
