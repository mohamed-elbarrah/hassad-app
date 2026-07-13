import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from "class-validator";

export class CreateBusinessGoalDto {
  @IsString()
  metric: string;

  @IsNumber()
  target: number;

  @IsOptional()
  @IsNumber()
  current?: number;

  @IsOptional()
  @IsString()
  period?: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}

export class UpdateBusinessGoalDto {
  @IsOptional()
  @IsString()
  metric?: string;

  @IsOptional()
  @IsNumber()
  target?: number;

  @IsOptional()
  @IsNumber()
  current?: number;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
