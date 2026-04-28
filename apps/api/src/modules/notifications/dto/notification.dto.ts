import { IsArray, IsUUID, IsString, IsOptional } from 'class-validator';

export class MarkReadDto {
  @IsArray()
  @IsUUID('all', { each: true })
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
