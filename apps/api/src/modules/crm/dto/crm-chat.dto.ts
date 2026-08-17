import { Type } from "class-transformer";
import { IsOptional, IsString, MinLength } from "class-validator";

export class CrmChatTargetsQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
