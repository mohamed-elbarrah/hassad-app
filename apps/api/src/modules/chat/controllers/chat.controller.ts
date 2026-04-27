import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { CreateConversationDto, AddParticipantDto, CreateMessageDto } from '../dto/chat.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @RequirePermissions('chat.create')
  createConversation(@Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(dto);
  }

  @Get('conversations/:id')
  @RequirePermissions('chat.read')
  findConversation(@Param('id') id: string) {
    return this.chatService.findConversation(id);
  }

  @Post('conversations/:id/participants')
  @RequirePermissions('chat.update')
  addParticipant(@Param('id') id: string, @Body() dto: AddParticipantDto) {
    return this.chatService.addParticipant(id, dto);
  }

  @Post('messages')
  @RequirePermissions('chat.message')
  createMessage(@CurrentUser() user: any, @Body() dto: CreateMessageDto) {
    return this.chatService.createMessage(user.id, dto);
  }

  @Get('conversations/:id/messages')
  @RequirePermissions('chat.read')
  getMessages(@Param('id') id: string) {
    return this.chatService.getMessages(id);
  }
}
