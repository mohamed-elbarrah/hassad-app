import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, Max, MaxLength } from "class-validator";
import { ContactLogResult, ContactLogType, RequestStatus } from "@hassad/shared";

export class AdminRequestQueryDto {
  @IsOptional() @IsString() @MaxLength(120) search?: string;
  @IsOptional() @IsUUID() assigneeId?: string;
  @IsOptional() @IsEnum(RequestStatus) status?: RequestStatus;
  @IsOptional() @IsUUID() clientId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class AdminRequestContactLogDto {
  @IsEnum(ContactLogType)
  type!: ContactLogType;

  @IsEnum(ContactLogResult)
  result!: ContactLogResult;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class AdminRequestIdParamDto {
  @IsUUID()
  id!: string;
}

export class AdminRequestReassignDto {
  @IsUUID() assigneeId!: string;
  @IsOptional() @IsString() reason?: string;
}

export class AdminRequestForceStatusDto {
  @IsEnum(RequestStatus) status!: RequestStatus;
  @IsString() reason!: string;
}

export class AdminRequestNotesDto {
  @IsString() notes!: string;
}
