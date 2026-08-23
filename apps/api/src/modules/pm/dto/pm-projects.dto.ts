import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ProjectStatus } from "@hassad/shared";
import { UpdateProjectDto } from "../../projects/dto/project.dto";

export class PmProjectsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 12;
}

export class PmProjectUpdateDto extends UpdateProjectDto {}

export class PmProjectStatusDto {
  @IsEnum(ProjectStatus)
  status!: ProjectStatus;
}
