import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateConversationDto, AddParticipantDto, CreateMessageDto } from '../dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        content: dto.content,
      },
      include: {
        sender: true,
      },
    });
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
