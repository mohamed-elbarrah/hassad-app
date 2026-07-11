import { IsOptional, IsString, IsUUID } from "class-validator";

export class ConvertToProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  pmId?: string;
}
