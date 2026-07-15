import { IsOptional, IsBoolean, IsString } from "class-validator";

export class UpdateGatewayDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  secretKey?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsString()
  publishableKey?: string;
}
