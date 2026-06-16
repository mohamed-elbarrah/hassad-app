import { Injectable, NotFoundException } from "@nestjs/common";
import { ConversationType, Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import {
  CreateConversationDto,
  AddParticipantDto,
  CreateMessageDto,
} from "../dto/chat.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { StorageService } from "../../../common/storage/storage.service";

import { ProjectTeamConversationService } from "./project-team-conversation.service";

interface AttachmentData {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
    private storageService: StorageService,
    private projectTeamConversationService: ProjectTeamConversationService,
  ) {}

  async getUserConversationIds(userId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    return participants.map((p) => p.conversationId);
  }

  async createConversation(dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        type: dto.type,
        clientId: dto.clientId,
        title: dto.title,
        participants: {
          create: dto.participantIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        client: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findMyConversations(
    userId: string,
    query: { page?: number; limit?: number; type?: string; clientId?: string },
  ) {
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

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          client: true,
          participants: { include: { user: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: true, attachments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findConversation(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        client: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async getOrCreateConversation(clientId: string, type: ConversationType) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { userId: true, accountManager: true, contactName: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    if (!client.userId) {
      throw new NotFoundException(
        "Cannot create conversation: client has no linked user account",
      );
    }

    const participantIds: string[] = [client.userId];

    if (type === ConversationType.SALES && client.accountManager) {
      const manager = await this.prisma.user.findUnique({
        where: { id: client.accountManager },
        select: { id: true, role: { select: { name: true } } },
      });

      if (manager && ["SALES", "ADMIN"].includes(manager.role.name)) {
        participantIds.push(manager.id);
      }
    }

    if (type === ConversationType.PM) {
      const project = await this.prisma.project.findFirst({
        where: { clientId, projectManagerId: { not: null } },
        select: { projectManagerId: true },
        orderBy: { createdAt: "desc" },
      });

      if (project?.projectManagerId) {
        const pm = await this.prisma.user.findUnique({
          where: { id: project.projectManagerId },
          select: { id: true, role: { select: { name: true } } },
        });

        if (pm && ["PM", "ADMIN"].includes(pm.role.name)) {
          participantIds.push(pm.id);
        }
      }
    }

    if (participantIds.length < 2) {
      throw new NotFoundException(
        "Cannot create conversation: no valid participant found for this conversation type",
      );
    }

    const userIds = [...new Set(participantIds)];

    const conversations = await this.prisma.conversation.findMany({
      where: {
        type,
        clientId,
        isActive: true,
      },
      include: {
        participants: { select: { userId: true } },
      },
    });

    for (const conv of conversations) {
      const convParticipantIds = conv.participants.map((p) => p.userId).sort();
      const expectedIds = [...userIds].sort();
      if (
        convParticipantIds.length === expectedIds.length &&
        convParticipantIds.every((id, i) => id === expectedIds[i])
      ) {
        return this.prisma.conversation.findUnique({
          where: { id: conv.id },
          include: {
            client: true,
            participants: { include: { user: true } },
          },
        });
      }
    }

    const title =
      type === ConversationType.SALES
        ? `محادثة مبيعات مع ${client.contactName}`
        : `محادثة مشروع مع ${client.contactName}`;

    return this.prisma.conversation.create({
      data: {
        type,
        clientId,
        title,
        participants: {
          create: userIds.map((uid) => ({ userId: uid })),
        },
      },
      include: {
        client: true,
        participants: { include: { user: true } },
      },
    });
  }

  async addParticipant(id: string, dto: AddParticipantDto) {
    return this.prisma.conversationParticipant.create({
      data: {
        conversationId: id,
        userId: dto.userId,
      },
    });
  }

  async findProjectTeamConversation(projectId: string) {
    return this.projectTeamConversationService.findTeamConversation(projectId);
  }

  async createMessage(senderId: string, dto: CreateMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        content: dto.content,
      },
      include: {
        sender: true,
      },
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId: dto.conversationId,
        userId: { not: senderId },
      },
      select: { userId: true },
    });

    if (participants.length > 0) {
      const truncatedContent =
        dto.content.length > 100
          ? dto.content.substring(0, 97) + "..."
          : dto.content;

      this.notificationsService
        .notifyUsers({
          userIds: participants.map((p) => p.userId),
          title: `رسالة جديدة من ${message.sender.name}`,
          message: truncatedContent,
          entityId: dto.conversationId,
          entityType: "conversation",
          eventType: "NEW_MESSAGE",
        })
        .catch(() => undefined);
    }

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
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        content: dto.content,
      },
      include: {
        sender: true,
      },
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

    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId: dto.conversationId,
        userId: { not: senderId },
      },
      select: { userId: true },
    });

    if (participants.length > 0) {
      const truncatedContent =
        dto.content.length > 100
          ? dto.content.substring(0, 97) + "..."
          : dto.content;
      const suffix =
        attachments.length > 0
          ? ` (${attachments.length} مرفق${attachments.length > 1 ? "ات" : ""})`
          : "";

      this.notificationsService
        .notifyUsers({
          userIds: participants.map((p) => p.userId),
          title: `رسالة جديدة من ${message.sender.name}`,
          message: truncatedContent + suffix,
          entityId: dto.conversationId,
          entityType: "conversation",
          eventType: "NEW_MESSAGE",
        })
        .catch(() => undefined);
    }

    this.eventEmitter.emit("chat.messageCreated", {
      ...message,
      conversationId: dto.conversationId,
    });

    const messageWithAttachments = await this.prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: true,
        attachments: true,
      },
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
    query?: { page?: number; limit?: number },
  ) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: true,
        attachments: true,
      },
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
}
