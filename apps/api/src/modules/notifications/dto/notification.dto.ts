import { IsArray, IsUUID, IsString, IsOptional, IsBoolean, IsInt, IsObject, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { Prisma } from "@prisma/client";

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
  /** New notifications should use an event code and structured metadata. */
  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsObject()
  metadata?: Prisma.InputJsonValue;

  @IsOptional()
  @IsString()
  /** @deprecated Retained so existing admin clients continue to work. */
  title?: string;

  @IsOptional()
  @IsString()
  /** @deprecated Retained so existing admin clients continue to work. */
  message?: string;

  @IsOptional()
  @IsArray()
  roles?: string[];

  @IsOptional()
  @IsArray()
  departments?: string[];
}
