import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ChatPresenceService } from "../../chat/services/chat-presence.service";

@Injectable()
export class AdminChatService {
  constructor(private readonly prisma: PrismaService, private readonly presence: ChatPresenceService) {}

  async findAllConversations(query: any) {
    const where: any = {};
    if (query.participantId) {
      where.participants = { some: { userId: query.participantId } };
    }
    if (query.isActive === "true") where.isActive = true;
    if (query.isActive === "false") where.isActive = false;

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        include: {
          participants: {
            include: { user: { select: { id: true, name: true } } },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const now = new Date();
    return {
      items: items.map((c) => {
        const lastMsg = c.messages[0];
        const daysSinceLastMsg = lastMsg
          ? Math.floor(
              (now.getTime() - new Date(lastMsg.createdAt).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;
        return {
          id: c.id,
          participants: c.participants.map((p) => ({
            id: p.user.id,
            name: p.user.name,
          })),
          lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
          lastMessageContent: lastMsg?.content ?? null,
          messageCount: c._count.messages,
          isActive: c.isActive,
          isStale: daysSinceLastMsg !== null && daysSinceLastMsg > 7,
          createdAt: c.createdAt.toISOString(),
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMessages(conversationId: string, query: any) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, name: true } },
          attachments: { select: { id: true, fileName: true, fileType: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      items: items.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender.name,
        content: m.content,
        attachments: m.attachments,
        createdAt: m.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async hideConversation(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isActive: false },
    });
    return { success: true };
  }
}
