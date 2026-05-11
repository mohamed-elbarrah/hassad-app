import { IsString, IsArray, IsUUID, IsOptional, IsEnum, IsIn } from 'class-validator';

export class CreateConversationDto {
  @IsEnum(['SALES', 'PM'])
  type: 'SALES' | 'PM';

  @IsUUID()
  clientId: string;

  @IsString()
  title: string;

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

export class GetConversationsQueryDto {
  @IsOptional()
  @IsIn(['SALES', 'PM'])
  type?: 'SALES' | 'PM';

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}