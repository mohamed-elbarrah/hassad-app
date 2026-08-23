import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
import { MeetingStatus, TaskDepartment, TaskPriority, FilePurpose } from "@hassad/shared";
import { IsUrl } from "class-validator";

export class CreatePmTaskDto {
  @IsEnum(TaskDepartment)
  dept: TaskDepartment;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsUUID()
  periodId?: string;

  @IsOptional()
  @IsBoolean()
  isVisibleToClient?: boolean;
}

export class AssignPmTaskDto {
  @IsUUID()
  userId: string;
}

function IsMeetingUrl() {
  return IsUrl(
    { protocols: ["http", "https"], require_protocol: true },
  );
}

export class CreatePmMeetingDto {
  @IsString()
  title: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMin?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @IsMeetingUrl()
  meetingLink?: string;

  @IsOptional()
  @IsUUID()
  periodId?: string;
}

export class UpdatePmMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMin?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @IsMeetingUrl()
  meetingLink?: string;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UploadPmProjectFileDto {
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @IsOptional()
  @IsEnum(FilePurpose)
  purpose?: FilePurpose;
}

export class PmAssignableUsersQueryDto {
  @IsOptional()
  @IsEnum(TaskDepartment)
  dept?: TaskDepartment;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;
}
