import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, Min, IsUUID } from 'class-validator';

export enum SymbolType {
  TEXT = 'TEXT',
  SVG_URL = 'SVG_URL',
  SVG_INLINE = 'SVG_INLINE',
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

  @IsString()
  @IsOptional()
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
  @Min(0)
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
  @Min(0)
  @IsOptional()
  exchangeRate?: number;
}
