import { Type } from "class-transformer";
import { IsOptional, IsString, MinLength, IsInt, Max, Min, MaxLength, Matches } from "class-validator";

export class MarketingChatTargetsQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/\S/)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
