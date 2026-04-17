import { IsEnum, IsOptional, IsString, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";
import { ProjectStatus } from "@hassad/shared";

export class ProjectFiltersDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
