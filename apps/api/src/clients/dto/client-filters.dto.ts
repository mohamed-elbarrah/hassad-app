import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientStatus, PipelineStage } from '@hassad/shared';

/**
 * ClientFiltersDto — query params for GET /clients.
 * All fields are optional and used for server-side filtering + pagination.
 */
export class ClientFiltersDto {
  @IsOptional()
  @IsEnum(ClientStatus, { message: 'status must be a valid ClientStatus' })
  status?: ClientStatus;

  @IsOptional()
  @IsEnum(PipelineStage, { message: 'stage must be a valid PipelineStage' })
  stage?: PipelineStage;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
