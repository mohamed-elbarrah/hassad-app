import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConversationType, Prisma } from "@prisma/client";

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class DirectConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(
    userAId: string,
    userBId: string,
    db?: DbClient,
    options?: {
      title?: string;
      clientId?: string;
    },
  ) {
    if (userAId === userBId) return null;

    const existing = await this.findExisting(userAId, userBId, db);
    if (existing) return existing;

    const users = await (db ?? this.prisma).user.findMany({
      where: { id: { in: [userAId, userBId] } },
      select: { id: true, name: true },
    });

    if (users.length !== 2) return null;

    const otherUser = users.find((u) => u.id !== userAId);
    const title = options?.title ?? otherUser?.name ?? "محادثة";

    return (db ?? this.prisma).conversation.create({
      data: {
        type: ConversationType.DIRECT,
        clientId: options?.clientId ?? null,
        title,
        participants: {
          create: [{ userId: userAId }, { userId: userBId }],
        },
      },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        participants: { include: { user: true } },
      },
    });
  }

  private async findExisting(userAId: string, userBId: string, db?: DbClient) {
    const conversations = await (db ?? this.prisma).conversation.findMany({
      where: {
        type: ConversationType.DIRECT,
        isActive: true,
        participants: { every: { userId: { in: [userAId, userBId] } } },
      },
      include: {
        participants: { select: { userId: true } },
        client: true,
        project: { select: { id: true, name: true } },
      },
    });

    for (const conv of conversations) {
      const ids = conv.participants.map((p) => p.userId).sort();
      const expected = [userAId, userBId].sort();
      if (ids.length === 2 && ids[0] === expected[0] && ids[1] === expected[1]) {
        return (db ?? this.prisma).conversation.findUnique({
          where: { id: conv.id },
          include: {
            client: true,
            project: { select: { id: true, name: true } },
            participants: { include: { user: true } },
          },
        });
      }
    }

    return null;
  }
}
