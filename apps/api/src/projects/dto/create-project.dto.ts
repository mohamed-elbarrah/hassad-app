import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MinLength,
  Matches,
} from "class-validator";
import { ProjectStatus } from "@hassad/shared";

export class CreateProjectDto {
  @IsString()
  @MinLength(2, { message: "Project name must be at least 2 characters" })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @Matches(/^c[^\s-]{8,}$/i, { message: "clientId must be a valid CUID" })
  clientId: string;

  @IsOptional()
  @IsString()
  @Matches(/^c[^\s-]{8,}$/i, { message: "contractId must be a valid CUID" })
  contractId?: string;

  @IsString()
  @Matches(/^c[^\s-]{8,}$/i, { message: "managerId must be a valid CUID" })
  managerId: string;

  @IsDateString({}, { message: "startDate must be a valid ISO date string" })
  startDate: string;

  @IsDateString({}, { message: "endDate must be a valid ISO date string" })
  endDate: string;
}
