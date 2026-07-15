import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  MaxLength,
  ArrayMaxSize,
} from "class-validator";
import { AiAssistantArea } from "@hassad/shared";

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsArray()
  @IsEnum(AiAssistantArea, { each: true })
  @ArrayMaxSize(6)
  areas: AiAssistantArea[];
}

export class SendMessageDto {
  @IsString()
  @MaxLength(5000)
  content: string;
}

export class ConversationListQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
