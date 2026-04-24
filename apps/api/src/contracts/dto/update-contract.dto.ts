import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  MinLength,
  IsEnum,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";
import { ContractStatus } from "@hassad/shared";

export class UpdateContractDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  services?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsUrl({}, { message: "fileUrl must be a valid URL" })
  fileUrl?: string;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
