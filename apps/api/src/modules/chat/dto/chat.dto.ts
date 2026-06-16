import {
  IsString,
  IsArray,
  IsUUID,
  IsOptional,
  IsEnum,
  IsIn,
} from "class-validator";

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
  content: string;
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
  page?: number;

  @IsOptional()
  limit?: number;
}
