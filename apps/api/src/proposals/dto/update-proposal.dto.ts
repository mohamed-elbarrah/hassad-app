import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  MinLength,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { ProposalStatus } from "@hassad/shared";

export class UpdateProposalDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  services?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;
}
