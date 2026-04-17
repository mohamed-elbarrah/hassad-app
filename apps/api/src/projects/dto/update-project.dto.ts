import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  MinLength,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";
import { ProjectStatus } from "@hassad/shared";

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Project name must be at least 2 characters" })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^c[^\s-]{8,}$/i, { message: "contractId must be a valid CUID" })
  contractId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^c[^\s-]{8,}$/i, { message: "managerId must be a valid CUID" })
  managerId?: string;

  @IsOptional()
  @IsDateString({}, { message: "startDate must be a valid ISO date string" })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: "endDate must be a valid ISO date string" })
  endDate?: string;

  @IsOptional()
  @IsEnum(ProjectStatus, { message: "status must be a valid ProjectStatus" })
  status?: ProjectStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}
