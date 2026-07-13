import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class ForceLeadStageDto {
  @IsString()
  @MinLength(1)
  stage: string;

  @IsString()
  @MinLength(1)
  reason: string;
}

export class StaleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number = 7;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
