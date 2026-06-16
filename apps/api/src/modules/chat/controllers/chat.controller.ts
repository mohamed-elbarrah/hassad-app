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
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ChatService } from "../services/chat.service";
import {
  CreateConversationDto,
  AddParticipantDto,
  CreateMessageDto,
  GetConversationsQueryDto,
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
  createConversation(@Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(dto);
  }

  @Get("conversations/by-client/:clientId/:type")
  @RequirePermissions("chat.read")
  getOrCreateConversation(
    @Param("clientId") clientId: string,
    @Param("type") type: "SALES" | "PM",
  ) {
    return this.chatService.getOrCreateConversation(clientId, type);
  }

  @Get("conversations/project/:projectId/team")
  @RequirePermissions("chat.read")
  async getProjectTeamConversation(
    @CurrentUser() user: any,
    @Param("projectId") projectId: string,
  ) {
    const conversation =
      await this.chatService.findProjectTeamConversation(projectId);

    if (!conversation) {
      throw new NotFoundException(
        `Team conversation for project ${projectId} not found`,
      );
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === user.id,
    );
    if (!isParticipant) {
      throw new ForbiddenException("You are not a member of this team chat");
    }

    return conversation;
  }

  @Get("conversations/:id")
  @RequirePermissions("chat.read")
  findConversation(@Param("id") id: string) {
    return this.chatService.findConversation(id);
  }

  @Post("conversations/:id/participants")
  @RequirePermissions("chat.update")
  addParticipant(@Param("id") id: string, @Body() dto: AddParticipantDto) {
    return this.chatService.addParticipant(id, dto);
  }

  @Post("messages")
  @RequirePermissions("chat.message")
  createMessage(@CurrentUser() user: any, @Body() dto: CreateMessageDto) {
    return this.chatService.createMessage(user.id, dto);
  }

  @Post("messages/with-files")
  @RequirePermissions("chat.message")
  @UseInterceptors(FilesInterceptor("files", 10))
  async createMessageWithFiles(
    @CurrentUser() user: any,
    @Body() dto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const attachments =
      files && files.length > 0
        ? await Promise.all(
            files.map(async (file) => {
              const uploadResult = await this.storageService.upload({
                category: StorageCategory.CHAT_ATTACHMENT,
                entityId: dto.conversationId,
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
      dto,
      attachments,
    );
  }

  @Get("conversations/:id/messages")
  @RequirePermissions("chat.read")
  getMessages(
    @Param("id") id: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.chatService.getMessages(id, query);
  }
}
