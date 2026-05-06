import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CreateConversationDto, AddParticipantDto, CreateMessageDto } from '../dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
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
        participants: {
          create: dto.participantIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findMyConversations(userId: string, query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          participants: { some: { userId } },
        },
        include: {
          participants: { include: { user: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: { participants: { some: { userId } } },
      }),
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

  async addParticipant(id: string, dto: AddParticipantDto) {
    return this.prisma.conversationParticipant.create({
      data: {
        conversationId: id,
        userId: dto.userId,
      },
    });
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
      const truncatedContent = dto.content.length > 100
        ? dto.content.substring(0, 97) + '...'
        : dto.content;

      this.notificationsService.notifyUsers({
        userIds: participants.map((p) => p.userId),
        title: `رسالة جديدة من ${message.sender.name}`,
        message: truncatedContent,
        entityId: dto.conversationId,
        entityType: "conversation",
        eventType: "NEW_MESSAGE",
      }).catch(() => undefined);
    }

    return message;
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
