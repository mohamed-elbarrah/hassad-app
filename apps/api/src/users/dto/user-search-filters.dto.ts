import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { UserRole, TaskDepartment } from "@hassad/shared";

export class UserSearchFiltersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(TaskDepartment)
  department?: TaskDepartment;

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
