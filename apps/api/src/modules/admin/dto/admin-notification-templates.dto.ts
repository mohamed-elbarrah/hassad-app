import { IsOptional, IsString, IsBoolean } from "class-validator";

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
}
