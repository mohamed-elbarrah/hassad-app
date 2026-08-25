import { IsArray, IsUUID, IsString, IsOptional, IsBoolean, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class NotificationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;
}

export class MarkReadDto {
  @IsArray()
  @IsUUID("all", { each: true })
  notificationIds: string[];
}

export class BroadcastNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  roles?: string[];

  @IsOptional()
  @IsArray()
  departments?: string[];
}
