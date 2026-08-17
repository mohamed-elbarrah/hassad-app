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

import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { StorageService } from "../../../common/storage/storage.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

import {
  CreateConversationDto,
  CreateMessageDto,
  GetConversationsQueryDto,
  GetMessagesQueryDto,
  UpdateMessageDto,
} from "../../chat/dto/chat.dto";
import { ChatService } from "../../chat/services/chat.service";
import { DirectConversationService } from "../../chat/services/direct-conversation.service";

import { CrmChatTargetsQueryDto } from "../dto/crm-chat.dto";
import { CrmChatService } from "../services/crm-chat.service";

@Controller("crm/chat")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly directConversationService: DirectConversationService,
    private readonly storageService: StorageService,
    private readonly crmChatService: CrmChatService,
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
  createConversation(@CurrentUser() user: any, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(user.id, dto);
  }

  @Get("conversations/:id")
  @RequirePermissions("chat.read")
  findConversation(@CurrentUser() user: any, @Param("id") id: string) {
    return this.chatService.findConversation(id, user.id);
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
      throw new NotFoundException("Could not create direct conversation");
    }
    return conversation;
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
                subPath: "messages",
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
      throw new NotFoundException("Could not create direct conversation");
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
                subPath: "messages",
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
    return this.chatService.updateMessage(conversationId, messageId, user.id, dto);
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

  @Get("targets/employees")
  @RequirePermissions("chat.read")
  searchEmployees(@Query() query: CrmChatTargetsQueryDto) {
    return this.crmChatService.searchEmployees(query.search ?? "", query.limit ?? 6);
  }

  @Get("targets/clients")
  @RequirePermissions("chat.read")
  searchClients(@Query() query: CrmChatTargetsQueryDto) {
    return this.crmChatService.searchClients(query.search ?? "", query.limit ?? 6);
  }
}
