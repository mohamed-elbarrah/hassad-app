import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsPositive, IsInt, Max } from "class-validator";
import { SanitizeSvg } from "../../../common/security/sanitize-svg.decorator";

export enum SymbolType { TEXT = "TEXT", SVG_URL = "SVG_URL", SVG_UPLOAD = "SVG_UPLOAD", SVG_INLINE = "SVG_INLINE" }

export class CreateCurrencySettingDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsString() symbol: string;
  @IsEnum(SymbolType) @IsOptional() symbolType?: SymbolType;
  @IsString() @IsOptional() @SanitizeSvg() svgKey?: string | null;
  @IsInt() @IsPositive() @Max(512) @IsOptional() svgWidth?: number;
  @IsInt() @IsPositive() @Max(512) @IsOptional() svgHeight?: number;
  @IsBoolean() @IsOptional() isDefault?: boolean;
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsNumber() @IsPositive() @IsOptional() exchangeRate?: number;
}

export class UpdateCurrencySettingDto {
  @IsString() @IsOptional() code?: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() symbol?: string;
  @IsEnum(SymbolType) @IsOptional() symbolType?: SymbolType;
  @IsString() @IsOptional() @SanitizeSvg() svgKey?: string | null;
  @IsInt() @IsPositive() @Max(512) @IsOptional() svgWidth?: number;
  @IsInt() @IsPositive() @Max(512) @IsOptional() svgHeight?: number;
  @IsBoolean() @IsOptional() isDefault?: boolean;
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsNumber() @IsPositive() @IsOptional() exchangeRate?: number;
}
