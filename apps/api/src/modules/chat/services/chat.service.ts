import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConversationType, Prisma } from "@prisma/client";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { StorageService } from "../../../common/storage/storage.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import {
  AddParticipantDto,
  CreateConversationDto,
  CreateMessageDto,
  GetConversationsQueryDto,
  UpdateMessageDto,
} from "../dto/chat.dto";
import { DirectConversationService } from "./direct-conversation.service";

interface AttachmentData {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

const userSummarySelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  isActive: true,
  lastLoginAt: true,
});

const messageInclude = Prisma.validator<Prisma.MessageInclude>()({
  sender: { select: userSummarySelect },
  deletedBy: { select: userSummarySelect },
  attachments: true,
  parentMessage: {
    select: {
      id: true,
      content: true,
      deletedAt: true,
      sender: { select: userSummarySelect },
    },
  },
});

const conversationInclude = Prisma.validator<Prisma.ConversationInclude>()({
  client: {
    select: {
      id: true,
      companyName: true,
      businessName: true,
      user: { select: userSummarySelect },
    },
  },
  project: { select: { id: true, name: true } },
  participants: {
    include: {
      user: { select: userSummarySelect },
    },
  },
});

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: StorageService,
    private readonly directConversationService: DirectConversationService,
  ) {}

  async getUserConversationIds(userId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    return participants.map((participant) => participant.conversationId);
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

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          ...conversationInclude,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: messageInclude,
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: await Promise.all(
        conversations.map(async (conversation) => ({
          ...this.mapConversation(conversation),
          messageCount: conversation._count.messages,
          lastMessage: conversation.messages[0]
            ? await this.mapMessage(conversation.messages[0])
            : null,
        })),
      ),
      total,
      page,
      limit,
    };
  }

  async findConversation(id: string, userId?: string) {
    const conversation = await this.findConversationRecord(id);

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    if (
      userId &&
      !conversation.participants.some((participant) => participant.userId === userId)
    ) {
      throw new ForbiddenException(
        "You are not a participant in this conversation",
      );
    }

    return this.mapConversation(conversation);
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const participantIds = Array.from(new Set([userId, ...dto.participantIds]));

    if (dto.type === ConversationType.DIRECT && participantIds.length !== 2) {
      throw new ForbiddenException(
        "Direct conversations must have exactly two participants",
      );
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: dto.type,
        clientId: dto.clientId ?? null,
        projectId: dto.projectId ?? null,
        title: dto.title ?? null,
        participants: {
          create: participantIds.map((id) => ({ userId: id })),
        },
      },
      include: conversationInclude,
    });

    return this.mapConversation(conversation);
  }

  async addParticipant(
    conversationId: string,
    dto: AddParticipantDto,
    currentUserId: string,
  ) {
    const conversation = await this.findConversationRecord(conversationId, currentUserId);

    if (conversation.type === ConversationType.DIRECT) {
      throw new ForbiddenException(
        "Cannot add participants to a direct conversation",
      );
    }

    const existing = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: dto.userId },
    });

    if (!existing) {
      await this.prisma.conversationParticipant.create({
        data: { conversationId, userId: dto.userId },
      });
    }

    const updated = await this.findConversationRecord(conversationId, currentUserId);
    return this.mapConversation(updated);
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
    currentUserId: string,
  ) {
    const conversation = await this.findConversationRecord(conversationId, currentUserId);

    if (conversation.type === ConversationType.DIRECT) {
      throw new ForbiddenException(
        "Cannot remove participants from a direct conversation",
      );
    }

    await this.prisma.conversationParticipant.deleteMany({
      where: { conversationId, userId },
    });

    const updated = await this.findConversationRecord(conversationId, currentUserId);
    return this.mapConversation(updated);
  }

  async createDirectMessage(
    senderId: string,
    targetUserId: string,
    dto: CreateMessageDto,
  ) {
    const conversation = await this.ensureDirectConversation(senderId, targetUserId);

    return this.createMessage(senderId, {
      ...dto,
      conversationId: conversation.id,
    });
  }

  async createMessage(senderId: string, dto: CreateMessageDto) {
    const conversation = await this.findConversationRecord(
      dto.conversationId,
      senderId,
    );
    const parentMessageId = await this.ensureParentMessageId(
      dto.parentMessageId,
      conversation.id,
    );

    const created = await this.prisma.message.create({
      data: Prisma.validator<Prisma.MessageUncheckedCreateInput>()({
        conversationId: conversation.id,
        senderId,
        content: dto.content,
        parentMessageId,
      }),
      include: messageInclude,
    });

    await this.touchConversation(conversation.id);

    this.notifyParticipants(
      conversation,
      senderId,
      dto.content,
      created.id,
    ).catch(() => undefined);

    const normalized = await this.getMessageById(created.id);
    this.eventEmitter.emit("chat.messageCreated", {
      conversationId: conversation.id,
      message: normalized,
    });

    return normalized;
  }

  async createMessageWithAttachments(
    senderId: string,
    dto: CreateMessageDto,
    attachments: AttachmentData[],
  ) {
    const conversation = await this.findConversationRecord(
      dto.conversationId,
      senderId,
    );
    const parentMessageId = await this.ensureParentMessageId(
      dto.parentMessageId,
      conversation.id,
    );

    const created = await this.prisma.message.create({
      data: Prisma.validator<Prisma.MessageUncheckedCreateInput>()({
        conversationId: conversation.id,
        senderId,
        content: dto.content,
        parentMessageId,
      }),
      include: messageInclude,
    });

    if (attachments.length > 0) {
      await this.prisma.messageAttachment.createMany({
        data: attachments.map((attachment) => ({
          messageId: created.id,
          filePath: attachment.key,
          fileName: attachment.originalName,
          fileType: attachment.mimeType,
        })),
      });
    }

    await this.touchConversation(conversation.id);

    this.notifyParticipants(
      conversation,
      senderId,
      dto.content,
      created.id,
      attachments.length,
    ).catch(() => undefined);

    const normalized = await this.getMessageById(created.id);
    this.eventEmitter.emit("chat.messageCreated", {
      conversationId: conversation.id,
      message: normalized,
    });

    return normalized;
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    userId: string,
    dto: UpdateMessageDto,
  ) {
    await this.findConversationRecord(conversationId, userId);
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: Prisma.validator<Prisma.MessageSelect>()({
        id: true,
        conversationId: true,
        senderId: true,
        deletedAt: true,
      }),
    });

    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException("Message not found");
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException("You can only edit your own messages");
    }

    if (message.deletedAt) {
      throw new ForbiddenException("Deleted messages cannot be edited");
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: Prisma.validator<Prisma.MessageUncheckedUpdateInput>()({
        content: dto.content,
        editedAt: new Date(),
      }),
    });

    await this.touchConversation(conversationId);

    const normalized = await this.getMessageById(messageId);
    this.eventEmitter.emit("chat.messageUpdated", {
      conversationId,
      message: normalized,
    });

    return normalized;
  }

  async deleteMessage(conversationId: string, messageId: string, userId: string) {
    await this.findConversationRecord(conversationId, userId);
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: Prisma.validator<Prisma.MessageSelect>()({
        id: true,
        conversationId: true,
        senderId: true,
        deletedAt: true,
      }),
    });

    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException("Message not found");
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException("You can only delete your own messages");
    }

    if (!message.deletedAt) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: Prisma.validator<Prisma.MessageUncheckedUpdateInput>()({
          deletedAt: new Date(),
          deletedById: userId,
        }),
      });
    }

    await this.touchConversation(conversationId);

    const normalized = await this.getMessageById(messageId);
    this.eventEmitter.emit("chat.messageDeleted", {
      conversationId,
      message: normalized,
    });

    return normalized;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    query?: { page?: number; limit?: number },
  ) {
    await this.findConversationRecord(conversationId, userId);

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: messageInclude,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return Promise.all(messages.map((message) => this.mapMessage(message)));
  }

  private async ensureDirectConversation(senderId: string, targetUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        clientProfile: {
          select: { id: true },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException("Target user not found");
    }

    const conversation = await this.directConversationService.getOrCreate(
      senderId,
      targetUserId,
      undefined,
      {
        clientId: targetUser.clientProfile?.id ?? undefined,
      },
    );

    if (!conversation) {
      throw new NotFoundException("Could not create direct conversation");
    }

    return conversation;
  }

  private async ensureParentMessageId(
    parentMessageId: string | undefined,
    conversationId: string,
  ) {
    if (!parentMessageId) {
      return null;
    }

    const parent = await this.prisma.message.findUnique({
      where: { id: parentMessageId },
      select: { id: true, conversationId: true },
    });

    if (!parent || parent.conversationId !== conversationId) {
      throw new NotFoundException("Reply target message not found");
    }

    return parent.id;
  }

  private async touchConversation(conversationId: string) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  private async findConversationRecord(id: string, userId?: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: conversationInclude,
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    if (
      userId &&
      !conversation.participants.some((participant) => participant.userId === userId)
    ) {
      throw new ForbiddenException(
        "You are not a participant in this conversation",
      );
    }

    return conversation;
  }

  private mapConversation(conversation: any) {
    const clientName =
      conversation.client?.companyName ??
      conversation.client?.businessName ??
      conversation.client?.user?.name ??
      null;

    return {
      id: conversation.id,
      type: conversation.type,
      title: conversation.title,
      isActive: conversation.isActive,
      updatedAt: conversation.updatedAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
      clientId: conversation.clientId,
      clientName,
      project: conversation.project
        ? {
            id: conversation.project.id,
            name: conversation.project.name,
          }
        : null,
      participants: conversation.participants.map((participant: any) => ({
        id: participant.user.id,
        name: participant.user.name,
        email: participant.user.email,
        avatarUrl: participant.user.avatarUrl,
        isActive: participant.user.isActive,
        lastLoginAt: participant.user.lastLoginAt?.toISOString() ?? null,
      })),
    };
  }

  private async getMessageById(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    return this.mapMessage(message);
  }

  private async mapMessage(message: any) {
    const attachments =
      message.attachments && message.attachments.length > 0
        ? await this.attachUrls(message.attachments)
        : [];

    return {
      id: message.id,
      conversationId: message.conversationId,
      content: message.deletedAt ? "" : message.content,
      displayContent: message.deletedAt
        ? "This message was deleted."
        : message.content,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt?.toISOString() ?? null,
      deletedAt: message.deletedAt?.toISOString() ?? null,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email,
        avatarUrl: message.sender.avatarUrl,
        isActive: message.sender.isActive,
        lastLoginAt: message.sender.lastLoginAt?.toISOString() ?? null,
      },
      deletedBy: message.deletedBy
        ? {
            id: message.deletedBy.id,
            name: message.deletedBy.name,
          }
        : null,
      attachments,
      replyTo: message.parentMessage
        ? {
            id: message.parentMessage.id,
            content: message.parentMessage.deletedAt
              ? "This message was deleted."
              : message.parentMessage.content,
            senderName: message.parentMessage.sender?.name ?? "Unknown sender",
          }
        : null,
    };
  }

  private async attachUrls(attachments: Array<any>) {
    const attachmentKeys = attachments.map((attachment) => attachment.filePath);
    const urlMap =
      await this.storageService.getMultiplePresignedUrls(attachmentKeys);

    return attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      filePath: attachment.filePath,
      uploadedAt: attachment.uploadedAt?.toISOString?.() ?? null,
      url: urlMap.get(attachment.filePath) || null,
    }));
  }

  private async notifyParticipants(
    conversation: any,
    senderId: string,
    content: string,
    messageId: string,
    attachmentCount = 0,
  ) {
    const recipients = conversation.participants
      .map((participant: any) => participant.userId)
      .filter((participantId: string) => participantId !== senderId);

    if (recipients.length === 0) return;

    const sender =
      conversation.participants.find((participant: any) => participant.userId === senderId)
        ?.user?.name ?? "عضو";
    const truncatedContent =
      content.length > 100 ? `${content.substring(0, 97)}...` : content;
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
      metadata: { messageId },
    });
  }
}
