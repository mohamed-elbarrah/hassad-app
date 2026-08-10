import { Type } from "class-transformer";
import { IsOptional, IsString, MinLength } from "class-validator";

export class PmChatTargetsQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
