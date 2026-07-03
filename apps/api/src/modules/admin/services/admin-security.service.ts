import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuerySecurityEventsDto } from "../dto/admin-security.dto";

@Injectable()
export class AdminSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async findEvents(query: QuerySecurityEventsDto) {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    return {
      items: items.map((e) => ({
        id: e.id,
        userId: e.userId,
        userName: e.user?.name ?? null,
        userEmail: e.user?.email ?? null,
        type: e.type,
        ip: e.ip,
        userAgent: e.userAgent,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      failedLogins24h,
      impersonations7d,
      passwordResets7d,
      activeSessions,
      twoFactorEnabled,
    ] = await Promise.all([
      this.prisma.securityEvent.count(),
      this.prisma.securityEvent.count({
        where: { type: "LOGIN_FAILED", createdAt: { gte: last24h } },
      }),
      this.prisma.securityEvent.count({
        where: { type: "IMPERSONATION", createdAt: { gte: last7d } },
      }),
      this.prisma.securityEvent.count({
        where: { type: "PASSWORD_RESET", createdAt: { gte: last7d } },
      }),
      this.prisma.session.count({
        where: { revokedAt: null, expiresAt: { gte: now } },
      }),
      this.prisma.user.count({
        where: { twoFactorEnabled: true },
      }),
    ]);

    return {
      totalEvents,
      failedLogins24h,
      impersonations7d,
      passwordResets7d,
      activeSessions,
      twoFactorEnabled,
    };
  }
}
