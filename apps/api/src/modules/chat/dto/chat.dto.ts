import {
  IsString,
  IsArray,
  IsUUID,
  IsOptional,
  IsEnum,
  IsIn,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateConversationDto {
  @IsEnum(["DIRECT", "GROUP"])
  type: "DIRECT" | "GROUP";

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsArray()
  @IsUUID("all", { each: true })
  participantIds: string[];
}

export class AddParticipantDto {
  @IsUUID()
  userId: string;
}

export class CreateMessageDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsUUID()
  parentMessageId?: string;
}

export class GetConversationsQueryDto {
  @IsOptional()
  @IsIn(["DIRECT", "GROUP"])
  type?: "DIRECT" | "GROUP";

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class GetMessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class UpdateMessageDto {
  @IsString()
  @MinLength(1)
  content: string;
}
