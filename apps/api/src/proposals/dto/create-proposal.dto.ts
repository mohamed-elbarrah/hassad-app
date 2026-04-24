import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Matches,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateProposalDto {
  @IsString()
  @Matches(/^c[^\s-]{8,}$/i, { message: "clientId must be a valid CUID" })
  clientId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  services: string[];

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
