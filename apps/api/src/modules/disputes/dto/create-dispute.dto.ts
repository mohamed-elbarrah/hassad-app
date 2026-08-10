import {
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
} from "class-validator";
import { DisputeCategory } from "@hassad/shared";
import { DisputeThreadType } from "@prisma/client";

export class CreateDisputeDto {
  @IsString()
  projectId: string;

  @IsEnum(DisputeCategory)
  category: DisputeCategory;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;
}

export class CreateDisputeMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsOptional()
  isInternal?: boolean;

  @IsOptional()
  @IsEnum(DisputeThreadType)
  threadType?: DisputeThreadType;
}
