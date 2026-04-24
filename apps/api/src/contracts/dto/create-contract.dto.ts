import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Matches,
  MinLength,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateContractDto {
  @IsString()
  @Matches(/^c[^\s-]{8,}$/i, { message: "clientId must be a valid CUID" })
  clientId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  services: string[];

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @Type(() => Number)
  @IsNumber()
  value: number;

  @IsOptional()
  @IsUrl({}, { message: "fileUrl must be a valid URL" })
  fileUrl?: string;
}
