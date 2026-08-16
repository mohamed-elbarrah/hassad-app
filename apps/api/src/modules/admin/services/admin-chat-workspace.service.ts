import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";
import { ChatPresenceService } from "../../chat/services/chat-presence.service";

@Injectable()
export class AdminWorkspaceChatService {
  constructor(private readonly prisma: PrismaService, private readonly presence: ChatPresenceService) {}

  async searchEmployees(search = "", limit = 6) {
    const where: Prisma.UserWhereInput = {
      isActive: true,
      clientProfile: { is: null },
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    };

    const items = await this.prisma.user.findMany({
      where,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        lastSeenAt: true,
        role: { select: { name: true } },
      },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        role: item.role.name,
        avatarUrl: item.avatarUrl,
        isActive: item.isActive,
        lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
        lastSeenAt: this.presence.lastSeenAt(item.id, item.lastSeenAt)?.toISOString() ?? null,
        isOnline: this.presence.isOnline(item.id),
      })),
    };
  }

  async searchClients(search = "", limit = 6) {
    const where: Prisma.UserWhereInput = {
      isActive: true,
      clientProfile: { isNot: null },
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            {
              clientProfile: {
                is: {
                  companyName: { contains: search, mode: "insensitive" },
                },
              },
            },
          ]
        : undefined,
    };

    const users = await this.prisma.user.findMany({
      where,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        lastLoginAt: true,
        lastSeenAt: true,
        clientProfile: {
          select: {
            companyName: true,
            businessName: true,
            status: true,
          },
        },
      },
    });

    return {
      items: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        companyName:
          user.clientProfile?.companyName ?? user.clientProfile?.businessName ?? null,
        status: user.clientProfile?.status ?? "ACTIVE",
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        lastSeenAt: this.presence.lastSeenAt(user.id, user.lastSeenAt)?.toISOString() ?? null,
        isOnline: this.presence.isOnline(user.id),
      })),
    };
  }
}
