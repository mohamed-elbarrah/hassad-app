import { IsString, IsOptional, IsBoolean, IsObject } from "class-validator";

export class UpdateNotificationTemplateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  translationKey?: string;

  @IsOptional()
  @IsObject()
  metadataSchema?: Record<string, unknown>;
}
