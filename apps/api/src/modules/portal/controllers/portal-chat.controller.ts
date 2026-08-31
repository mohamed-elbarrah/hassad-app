import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  CurrentUser,
  type JwtPayload,
} from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import {
  ChatAttachmentService,
  CHAT_UPLOAD_LIMITS,
} from "../../../common/storage/chat-attachment.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import {
  AddParticipantDto,
  CreateConversationDto,
  CreateMessageDto,
  GetConversationsQueryDto,
  GetMessagesQueryDto,
  UpdateMessageDto,
} from "../../chat/dto/chat.dto";
import { ChatService } from "../../chat/services/chat.service";
import { DirectConversationService } from "../../chat/services/direct-conversation.service";
import { ProjectGroupChatService } from "../../chat/services/project-group-chat.service";

/** Portal-owned adapter over the shared chat domain services. */
@Controller("portal/chat")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PortalChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly projectGroupChatService: ProjectGroupChatService,
    private readonly directConversationService: DirectConversationService,
    private readonly chatAttachmentService: ChatAttachmentService,
  ) {}

  @Get("conversations")
  @RequirePermissions("chat.read")
  findMyConversations(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetConversationsQueryDto,
  ) {
    return this.chatService.findMyConversations(user.id, query);
  }

  @Post("conversations/:id/read")
  @RequirePermissions("chat.read")
  markConversationRead(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.chatService.markConversationRead(id, user.id);
  }

  @Post("conversations")
  @RequirePermissions("chat.create")
  createConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(user.id, dto);
  }

  @Get("conversations/direct/:userId")
  @RequirePermissions("chat.read")
  async getDirectConversation(
    @CurrentUser() user: JwtPayload,
    @Param("userId") otherUserId: string,
  ) {
    const conversation = await this.directConversationService.getOrCreate(
      user.id,
      otherUserId,
    );
    if (!conversation) {
      throw new NotFoundException({
        code: "DIRECT_CONVERSATION_CREATE_FAILED",
        details: {},
      });
    }
    return this.chatService.getConversationDetails(conversation.id, user.id);
  }

  @Get("conversations/project/:projectId/group")
  @RequirePermissions("chat.read")
  async getProjectGroupChat(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    await this.chatService.assertProjectAccess(projectId, user.id);
    const conversation = await this.projectGroupChatService.ensure(projectId);
    if (!conversation) {
      throw new NotFoundException({
        code: "PROJECT_GROUP_CHAT_NOT_FOUND",
        details: { projectId },
      });
    }
    return this.chatService.getConversationDetails(conversation.id, user.id);
  }

  @Get("conversations/:id")
  @RequirePermissions("chat.read")
  findConversation(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.chatService.findConversation(id, user.id);
  }

  @Post("conversations/:id/participants")
  @RequirePermissions("chat.update")
  addParticipant(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: AddParticipantDto,
  ) {
    return this.chatService.addParticipant(id, dto, user.id);
  }

  @Delete("conversations/:id/participants/:userId")
  @RequirePermissions("chat.update")
  removeParticipant(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ) {
    return this.chatService.removeParticipant(id, userId, user.id);
  }

  @Post("conversations/:id/messages")
  @RequirePermissions("chat.message")
  createMessage(
    @CurrentUser() user: JwtPayload,
    @Param("id") conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.createMessage(user.id, {
      ...dto,
      conversationId,
    });
  }

  @Post("conversations/direct/:userId/messages")
  @RequirePermissions("chat.message")
  createDirectMessage(
    @CurrentUser() user: JwtPayload,
    @Param("userId") otherUserId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.createDirectMessage(user.id, otherUserId, dto);
  }

  @Post("conversations/:id/messages/with-files")
  @RequirePermissions("chat.message")
  @UseInterceptors(
    FilesInterceptor("files", CHAT_UPLOAD_LIMITS.files, {
      limits: CHAT_UPLOAD_LIMITS,
    }),
  )
  async createMessageWithFiles(
    @CurrentUser() user: JwtPayload,
    @Param("id") conversationId: string,
    @Body() dto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    await this.chatService.assertConversationAccess(conversationId, user.id);
    const attachments = await this.chatAttachmentService.upload(
      conversationId,
      files,
    );
    return this.chatService.createMessageWithAttachments(
      user.id,
      { ...dto, conversationId },
      attachments,
    );
  }

  @Post("conversations/direct/:userId/messages/with-files")
  @RequirePermissions("chat.message")
  @UseInterceptors(
    FilesInterceptor("files", CHAT_UPLOAD_LIMITS.files, {
      limits: CHAT_UPLOAD_LIMITS,
    }),
  )
  async createDirectMessageWithFiles(
    @CurrentUser() user: JwtPayload,
    @Param("userId") otherUserId: string,
    @Body() dto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const conversation = await this.directConversationService.getOrCreate(
      user.id,
      otherUserId,
    );
    if (!conversation) {
      throw new NotFoundException({
        code: "DIRECT_CONVERSATION_CREATE_FAILED",
        details: {},
      });
    }
    await this.chatService.assertConversationAccess(conversation.id, user.id);
    const attachments = await this.chatAttachmentService.upload(
      conversation.id,
      files,
    );
    return this.chatService.createMessageWithAttachments(
      user.id,
      { ...dto, conversationId: conversation.id },
      attachments,
    );
  }

  @Get("conversations/:id/messages")
  @RequirePermissions("chat.read")
  getMessages(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.chatService.getMessages(id, user.id, query);
  }

  @Patch("conversations/:conversationId/messages/:messageId")
  @RequirePermissions("chat.message")
  updateMessage(
    @CurrentUser() user: JwtPayload,
    @Param("conversationId") conversationId: string,
    @Param("messageId") messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.chatService.updateMessage(
      conversationId,
      messageId,
      user.id,
      dto,
    );
  }

  @Delete("conversations/:conversationId/messages/:messageId")
  @RequirePermissions("chat.message")
  deleteMessage(
    @CurrentUser() user: JwtPayload,
    @Param("conversationId") conversationId: string,
    @Param("messageId") messageId: string,
  ) {
    return this.chatService.deleteMessage(conversationId, messageId, user.id);
  }
}
