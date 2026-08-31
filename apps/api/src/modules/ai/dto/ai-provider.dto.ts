import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  IsIn,
} from "class-validator";
import { ADAPTER_FACTORIES } from "../adapters/adapter-factory";

const SUPPORTED_PROVIDER_NAMES = Object.keys(ADAPTER_FACTORIES);

export class FetchModelsDto {
  @IsString()
  @IsIn(SUPPORTED_PROVIDER_NAMES)
  name: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;
}

export class CreateAiProviderDto {
  @IsString()
  @IsIn(SUPPORTED_PROVIDER_NAMES)
  name: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  models?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  requestsPerMinute?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  tokensPerMinute?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;
}

export class UpdateAiProviderDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  models?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  requestsPerMinute?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  tokensPerMinute?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;
}
