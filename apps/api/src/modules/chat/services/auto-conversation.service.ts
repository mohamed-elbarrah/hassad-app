import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConversationType, Prisma } from "@prisma/client";

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AutoConversationService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateUserRole(
    userId: string,
    allowedRoles: string[],
    db?: DbClient,
  ): Promise<boolean> {
    const user = await (db ?? this.prisma).user.findUnique({
      where: { id: userId },
      select: { id: true, role: { select: { name: true } } },
    });
    return !!user && allowedRoles.includes(user.role.name);
  }

  async ensureSalesConversation(
    clientId: string,
    salesUserId: string,
    db?: DbClient,
  ) {
    const client = await (db ?? this.prisma).client.findUnique({
      where: { id: clientId },
      select: { userId: true, contactName: true },
    });

    if (!client?.userId) return null;

    const isSalesOrAdmin = await this.validateUserRole(
      salesUserId,
      ["SALES", "ADMIN"],
      db,
    );
    if (!isSalesOrAdmin) return null;

    const existing = await this.findExistingConversation(
      clientId,
      ConversationType.SALES,
      [client.userId, salesUserId],
      db,
    );

    if (existing) return existing;

    return (db ?? this.prisma).conversation.create({
      data: {
        type: ConversationType.SALES,
        clientId,
        title: `محادثة مبيعات مع ${client.contactName}`,
        participants: {
          create: [{ userId: client.userId }, { userId: salesUserId }],
        },
      },
      include: {
        client: true,
        participants: { include: { user: true } },
      },
    });
  }

  async ensurePmConversation(clientId: string, pmUserId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { userId: true, contactName: true },
    });

    if (!client?.userId) return null;

    const isPm = await this.validateUserRole(pmUserId, ["PM", "ADMIN"]);
    if (!isPm) return null;

    const existing = await this.findExistingConversation(
      clientId,
      ConversationType.PM,
      [client.userId, pmUserId],
    );

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        type: ConversationType.PM,
        clientId,
        title: `محادثة مشروع مع ${client.contactName}`,
        participants: {
          create: [{ userId: client.userId }, { userId: pmUserId }],
        },
      },
      include: {
        client: true,
        participants: { include: { user: true } },
      },
    });
  }

  private async findExistingConversation(
    clientId: string,
    type: ConversationType,
    userIds: string[],
    db?: DbClient,
  ) {
    const conversations = await (db ?? this.prisma).conversation.findMany({
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
      const participantIds = conv.participants.map((p) => p.userId).sort();
      const expectedIds = [...userIds].sort();
      if (
        participantIds.length === expectedIds.length &&
        participantIds.every((id, i) => id === expectedIds[i])
      ) {
        return (db ?? this.prisma).conversation.findUnique({
          where: { id: conv.id },
          include: {
            client: true,
            participants: { include: { user: true } },
          },
        });
      }
    }

    return null;
  }
}