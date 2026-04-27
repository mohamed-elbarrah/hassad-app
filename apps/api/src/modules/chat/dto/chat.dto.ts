import { IsString, IsArray, IsUUID, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @IsUUID('all', { each: true })
  participantIds: string[];
}

export class AddParticipantDto {
  @IsUUID()
  userId: string;
}

export class CreateMessageDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  content: string;
}
