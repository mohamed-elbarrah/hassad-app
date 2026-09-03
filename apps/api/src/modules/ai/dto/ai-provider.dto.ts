import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  IsIn,
  IsNotEmpty,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";
import { ADAPTER_FACTORIES } from "../adapters/adapter-factory";
import { isSafeCustomBaseUrl } from "../adapters/provider.interface";

function SafeBaseUrl(validationOptions?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) => {
    registerDecorator({
      name: "safeBaseUrl",
      target: target.constructor,
      propertyName: propertyKey.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return value === "" || (typeof value === "string" && isSafeCustomBaseUrl(value));
        },
      },
    });
  };
}

const SUPPORTED_PROVIDER_NAMES = Object.keys(ADAPTER_FACTORIES);

export class FetchModelsDto {
  @IsString()
  @IsIn(SUPPORTED_PROVIDER_NAMES)
  name: string;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsOptional()
  @IsString()
  @SafeBaseUrl()
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
  @SafeBaseUrl()
  baseUrl?: string;

  @IsString()
  @IsNotEmpty()
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
  @SafeBaseUrl()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
