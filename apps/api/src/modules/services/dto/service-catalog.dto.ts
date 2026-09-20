import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsNotEmpty,
  IsArray,
  Min,
  IsUUID,
  IsBoolean,
} from "class-validator";
import { ServiceCategory } from "@hassad/shared";

export class CreateServiceCatalogDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateServiceCatalogDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameAr?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateDeliverableTemplateDto {
  @IsString()
  serviceId: string;

  @IsString()
  title: string;

  @IsString()
  titleAr: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateAdminDeliverableTemplateDto {
  @IsString()
  title: string;

  @IsString()
  titleAr: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
