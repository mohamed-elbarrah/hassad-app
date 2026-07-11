import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConversationType, Prisma } from "@prisma/client";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { StorageService } from "../../../common/storage/storage.service";
import {
  CreateMessageDto,
  CreateConversationDto,
  AddParticipantDto,
  GetConversationsQueryDto,
} from "../dto/chat.dto";

interface AttachmentData {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: StorageService,
  ) {}

  async getUserConversationIds(userId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    return participants.map((p) => p.conversationId);
  }

  async findMyConversations(userId: string, query: GetConversationsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const where: Prisma.ConversationWhereInput = {
      participants: { some: { userId } },
      isActive: true,
    };

    if (query.type) {
      where.type = query.type as ConversationType;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          client: true,
          project: { select: { id: true, name: true } },
          participants: { include: { user: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: true, attachments: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findConversation(id: string, userId?: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        participants: { include: { user: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    if (userId && !conversation.participants.some((p) => p.userId === userId)) {
      throw new ForbiddenException(
        "You are not a participant in this conversation",
      );
    }

    return conversation;
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const participantIds = Array.from(new Set([userId, ...dto.participantIds]));

    if (dto.type === ConversationType.DIRECT && participantIds.length !== 2) {
      throw new ForbiddenException(
        "Direct conversations must have exactly two participants",
      );
    }

    return this.prisma.conversation.create({
      data: {
        type: dto.type,
        clientId: dto.clientId ?? null,
        projectId: dto.projectId ?? null,
        title: dto.title ?? null,
        participants: {
          create: participantIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        participants: { include: { user: true } },
      },
    });
  }

  async addParticipant(
    conversationId: string,
    dto: AddParticipantDto,
    currentUserId: string,
  ) {
    const conversation = await this.findConversation(
      conversationId,
      currentUserId,
    );

    if (conversation.type === ConversationType.DIRECT) {
      throw new ForbiddenException(
        "Cannot add participants to a direct conversation",
      );
    }

    const exists = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: dto.userId },
    });

    if (exists) return conversation;

    await this.prisma.conversationParticipant.create({
      data: { conversationId, userId: dto.userId },
    });

    return this.findConversation(conversationId);
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
    currentUserId: string,
  ) {
    const conversation = await this.findConversation(
      conversationId,
      currentUserId,
    );

    if (conversation.type === ConversationType.DIRECT) {
      throw new ForbiddenException(
        "Cannot remove participants from a direct conversation",
      );
    }

    await this.prisma.conversationParticipant.deleteMany({
      where: { conversationId, userId },
    });

    return this.findConversation(conversationId);
  }

  async createMessage(senderId: string, dto: CreateMessageDto) {
    const conversation = await this.findConversation(
      dto.conversationId,
      senderId,
    );

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        content: dto.content,
      },
      include: { sender: true },
    });

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    this.notifyParticipants(
      conversation,
      senderId,
      dto.content,
      message.id,
    ).catch(() => undefined);
    this.eventEmitter.emit("chat.messageCreated", {
      ...message,
      conversationId: dto.conversationId,
    });

    return message;
  }

  async createMessageWithAttachments(
    senderId: string,
    dto: CreateMessageDto,
    attachments: AttachmentData[],
  ) {
    const conversation = await this.findConversation(
      dto.conversationId,
      senderId,
    );

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        content: dto.content,
      },
      include: { sender: true },
    });

    if (attachments.length > 0) {
      await this.prisma.messageAttachment.createMany({
        data: attachments.map((att) => ({
          messageId: message.id,
          filePath: att.key,
          fileName: att.originalName,
          fileType: att.mimeType,
        })),
      });
    }

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    this.notifyParticipants(
      conversation,
      senderId,
      dto.content,
      message.id,
      attachments.length,
    ).catch(() => undefined);

    this.eventEmitter.emit("chat.messageCreated", {
      ...message,
      conversationId: dto.conversationId,
    });

    const messageWithAttachments = await this.prisma.message.findUnique({
      where: { id: message.id },
      include: { sender: true, attachments: true },
    });

    if (
      messageWithAttachments &&
      messageWithAttachments.attachments.length > 0
    ) {
      const attachmentKeys = messageWithAttachments.attachments.map(
        (a) => a.filePath,
      );
      const urlMap =
        await this.storageService.getMultiplePresignedUrls(attachmentKeys);
      (messageWithAttachments as any).attachments =
        messageWithAttachments.attachments.map((att) => ({
          ...att,
          url: urlMap.get(att.filePath) || null,
        }));
    }

    return messageWithAttachments;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    query?: { page?: number; limit?: number },
  ) {
    await this.findConversation(conversationId, userId);

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: true, attachments: true },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const allAttachmentKeys = messages.flatMap(
      (m) => m.attachments?.map((a) => a.filePath) ?? [],
    );

    if (allAttachmentKeys.length > 0) {
      const urlMap =
        await this.storageService.getMultiplePresignedUrls(allAttachmentKeys);
      for (const msg of messages) {
        if (msg.attachments && msg.attachments.length > 0) {
          (msg as any).attachments = msg.attachments.map((att) => ({
            ...att,
            url: urlMap.get(att.filePath) || null,
          }));
        }
      }
    }

    return messages;
  }

  private async notifyParticipants(
    conversation: any,
    senderId: string,
    content: string,
    messageId: string,
    attachmentCount = 0,
  ) {
    const recipients = conversation.participants
      .map((p: any) => p.userId)
      .filter((id: string) => id !== senderId);

    if (recipients.length === 0) return;

    const sender =
      conversation.participants.find((p: any) => p.userId === senderId)?.user
        ?.name ?? "عضو";
    const truncatedContent =
      content.length > 100 ? content.substring(0, 97) + "..." : content;
    const suffix =
      attachmentCount > 0
        ? ` (${attachmentCount} مرفق${attachmentCount > 1 ? "ات" : ""})`
        : "";

    await this.notificationsService.notifyUsers({
      userIds: recipients,
      title: `رسالة جديدة من ${sender}`,
      message: truncatedContent + suffix,
      entityId: conversation.id,
      entityType: "conversation",
      eventType: "NEW_MESSAGE",
    });
  }
}
