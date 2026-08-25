import {
  IsString,
  IsArray,
  IsUUID,
  IsOptional,
  IsEnum,
  IsInt,
  Max,
  Min,
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
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class GetMessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class UpdateMessageDto {
  @IsString()
  @MinLength(1)
  content: string;
}
