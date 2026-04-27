import { IsString, IsEnum, IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ProjectStatus, TaskPriority, ProjectMemberRole } from '@hassad/shared';

export class CreateProjectDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsOptional()
  @IsUUID()
  projectManagerId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(ProjectMemberRole)
  role: ProjectMemberRole;
}
