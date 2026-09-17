import { Type } from "class-transformer";
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class R2SettingsDto {
  @IsOptional() @IsString() @MaxLength(2048) endpoint?: string;
  @IsOptional() @IsString() @MaxLength(255) bucket?: string;
  @IsOptional() @IsString() @MaxLength(2048) publicDomain?: string | null;
  @IsOptional() @IsString() @MaxLength(512) accessKey?: string;
  @IsOptional() @IsString() @MaxLength(512) secretKey?: string;
}

export class UpdateIntegrationsDto {
  @IsOptional() @IsString() @MaxLength(32) whatsappPhone?: string | null;
  @IsOptional() @ValidateNested() @Type(() => R2SettingsDto) r2?: R2SettingsDto;
}
