import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class SalesNewClientServiceItemDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateSalesNewClientRequestDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(/^[0-9+()\s.-]{7,30}$/)
  phoneWhatsapp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/\S/)
  password: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesNewClientServiceItemDto)
  services: SalesNewClientServiceItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
