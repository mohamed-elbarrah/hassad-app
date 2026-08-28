import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsPositive,
} from "class-validator";
import { SanitizeSvg } from "../../../common/security/sanitize-svg.decorator";

export enum SymbolType {
  TEXT = "TEXT",
  SVG_URL = "SVG_URL",
  SVG_UPLOAD = "SVG_UPLOAD",
  SVG_INLINE = "SVG_INLINE",
}

export class CreateCurrencySettingDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsEnum(SymbolType)
  @IsOptional()
  symbolType?: SymbolType;

  // SanitizeSvg closes the gap where the file-upload endpoint sanitized
  // SVG content but the JSON DTO path did not. Idempotent on clean input.
  @IsString()
  @IsOptional()
  @SanitizeSvg()
  svgKey?: string;

  @IsNumber()
  @IsOptional()
  svgWidth?: number;

  @IsNumber()
  @IsOptional()
  svgHeight?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  exchangeRate?: number;
}

export class UpdateCurrencySettingDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  symbol?: string;

  @IsEnum(SymbolType)
  @IsOptional()
  symbolType?: SymbolType;

  @IsString()
  @IsOptional()
  @SanitizeSvg()
  svgKey?: string;

  @IsNumber()
  @IsOptional()
  svgWidth?: number;

  @IsNumber()
  @IsOptional()
  svgHeight?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  exchangeRate?: number;
}
