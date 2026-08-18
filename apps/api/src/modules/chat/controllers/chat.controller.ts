import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Delete,
  Patch,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ChatService } from "../services/chat.service";
import { ProjectGroupChatService } from "../services/project-group-chat.service";
import { DirectConversationService } from "../services/direct-conversation.service";
import {
  CreateConversationDto,
  AddParticipantDto,
  CreateMessageDto,
  GetConversationsQueryDto,
  GetMessagesQueryDto,
  UpdateMessageDto,
} from "../dto/chat.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";

@Controller("")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly projectGroupChatService: ProjectGroupChatService,
    private readonly directConversationService: DirectConversationService,
    private readonly storageService: StorageService,
  ) {}

  @Get("conversations")
  @RequirePermissions("chat.read")
  findMyConversations(
    @CurrentUser() user: any,
    @Query() query: GetConversationsQueryDto,
  ) {
    return this.chatService.findMyConversations(user.id, query);
  }

  @Post("conversations")
  @RequirePermissions("chat.create")
  createConversation(
    @CurrentUser() user: any,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(user.id, dto);
  }

  @Get("conversations/direct/:userId")
  @RequirePermissions("chat.read")
  async getDirectConversation(
    @CurrentUser() user: any,
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
    return conversation;
  }

  @Get("conversations/:id")
  @RequirePermissions("chat.read")
  findConversation(@CurrentUser() user: any, @Param("id") id: string) {
    return this.chatService.findConversation(id, user.id);
  }

  @Get("conversations/project/:projectId/group")
  @RequirePermissions("chat.read")
  async getProjectGroupChat(
    @CurrentUser() user: any,
    @Param("projectId") projectId: string,
  ) {
    const conversation = await this.projectGroupChatService.ensure(projectId);
    if (!conversation) {
      throw new NotFoundException({
        code: "PROJECT_GROUP_CHAT_NOT_FOUND",
        details: {},
      });
    }
    if (!conversation.participants.some((p) => p.userId === user.id)) {
      throw new ForbiddenException({
        code: "CHAT_MEMBERSHIP_REQUIRED",
        details: {},
      });
    }
    return conversation;
  }

  @Post("conversations/:id/participants")
  @RequirePermissions("chat.update")
  addParticipant(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: AddParticipantDto,
  ) {
    return this.chatService.addParticipant(id, dto, user.id);
  }

  @Delete("conversations/:id/participants/:userId")
  @RequirePermissions("chat.update")
  removeParticipant(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Param("userId") userId: string,
  ) {
    return this.chatService.removeParticipant(id, userId, user.id);
  }

  @Post("conversations/:id/messages")
  @RequirePermissions("chat.message")
  createMessage(
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
    @Param("userId") otherUserId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.createDirectMessage(user.id, otherUserId, dto);
  }

  @Post("conversations/:id/messages/with-files")
  @RequirePermissions("chat.message")
  @UseInterceptors(FilesInterceptor("files", 10))
  async createMessageWithFiles(
    @CurrentUser() user: any,
    @Param("id") conversationId: string,
    @Body() dto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const attachments =
      files && files.length > 0
        ? await Promise.all(
            files.map(async (file) => {
              const uploadResult = await this.storageService.upload({
                category: StorageCategory.CHAT_ATTACHMENT,
                entityId: conversationId,
                file: {
                  buffer: file.buffer,
                  originalname: file.originalname,
                  mimetype: file.mimetype,
                  size: file.size,
                },
                subPath: `messages`,
              });
              return {
                key: uploadResult.key,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
              };
            }),
          )
        : [];

    return this.chatService.createMessageWithAttachments(
      user.id,
      {
        ...dto,
        conversationId,
      },
      attachments,
    );
  }

  @Post("conversations/direct/:userId/messages/with-files")
  @RequirePermissions("chat.message")
  @UseInterceptors(FilesInterceptor("files", 10))
  async createDirectMessageWithFiles(
    @CurrentUser() user: any,
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

    const attachments =
      files && files.length > 0
        ? await Promise.all(
            files.map(async (file) => {
              const uploadResult = await this.storageService.upload({
                category: StorageCategory.CHAT_ATTACHMENT,
                entityId: conversation.id,
                file: {
                  buffer: file.buffer,
                  originalname: file.originalname,
                  mimetype: file.mimetype,
                  size: file.size,
                },
                subPath: `messages`,
              });
              return {
                key: uploadResult.key,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
              };
            }),
          )
        : [];

    return this.chatService.createMessageWithAttachments(
      user.id,
      {
        ...dto,
        conversationId: conversation.id,
      },
      attachments,
    );
  }

  @Get("conversations/:id/messages")
  @RequirePermissions("chat.read")
  getMessages(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.chatService.getMessages(id, user.id, query);
  }

  @Patch("conversations/:conversationId/messages/:messageId")
  @RequirePermissions("chat.message")
  updateMessage(
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
    @Param("conversationId") conversationId: string,
    @Param("messageId") messageId: string,
  ) {
    return this.chatService.deleteMessage(conversationId, messageId, user.id);
  }
}
