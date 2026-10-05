import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import {
  AnnouncementAudienceType,
  AnnouncementPriority,
  AnnouncementType,
  IssueCategory,
  IssueSeverity,
  IssueStatus,
} from "@prisma/client";

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

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
  @IsEnum(AnnouncementAudienceType, { each: true })
  audiences!: AnnouncementAudienceType[];
}

export class UpdateAnnouncementDto extends CreateAnnouncementDto {}

export class CreateIssueReportDto {
  @IsEnum(IssueCategory)
  category!: IssueCategory;

  @IsEnum(IssueSeverity)
  severity!: IssueSeverity;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
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

export class AssignIssueDto {
  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class CreateIssueMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;
}
