import { IsString, IsUUID, IsOptional, IsJSON, IsArray } from 'class-validator';

export class CreateDeliverableDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  filePath: string;
}

export class CreateRevisionDto {
  @IsString()
  requestDescription: string;
}

export class CreateIntakeFormDto {
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsArray()
  goals?: any[];

  @IsOptional()
  @IsArray()
  uploadedFiles?: any[];
}
