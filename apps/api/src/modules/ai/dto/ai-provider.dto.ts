import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, IsIn } from "class-validator";

export class FetchModelsDto {
  @IsString()
  @IsIn(["openai", "openrouter", "anthropic", "google"])
  name: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;
}

export class CreateAiProviderDto {
  @IsString()
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
