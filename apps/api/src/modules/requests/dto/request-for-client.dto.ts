import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class RequestServiceItemDto {
  @IsString()
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
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RequestServiceItemDto)
  services: RequestServiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
