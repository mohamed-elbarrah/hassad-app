import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from "class-validator";
import {
  AnnouncementAudienceType,
  AnnouncementStatus,
  AnnouncementType,
  IssueCategory,
  IssueStatus,
} from "@prisma/client";

export class CreateAnnouncementDto {
  @IsString()
  @Matches(/\S/)
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @Matches(/\S/)
  @MinLength(1)
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  allowDismissal?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  actionLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  actionUrl?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(AnnouncementAudienceType, { each: true })
  audiences!: AnnouncementAudienceType[];
}

export class UpdateAnnouncementDto extends CreateAnnouncementDto {}

export class UpdateAnnouncementStatusDto {
  @IsEnum(AnnouncementStatus)
  status!: AnnouncementStatus;
}

export class CreateIssueReportDto {
  @IsEnum(IssueCategory)
  category!: IssueCategory;

  @IsString()
  @Matches(/\S/)
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @Matches(/\S/)
  @MinLength(1)
  @MaxLength(10000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pagePath?: string;
}

export class UpdateIssueStatusDto {
  @IsEnum(IssueStatus)
  status!: IssueStatus;
}

export class CreateIssueMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;
}
