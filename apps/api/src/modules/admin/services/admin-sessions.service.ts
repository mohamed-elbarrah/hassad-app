import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuerySessionsDto, SessionResponse } from "../dto/admin-sessions.dto";

@Injectable()
export class AdminSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySessionsDto) {
    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.search) {
      where.user = {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: s.user.name,
        userEmail: s.user.email,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        isActive: !s.revokedAt && s.expiresAt > new Date(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async revoke(sessionId: string, adminId: string): Promise<{ revoked: true }> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException({ code: "SESSION_NOT_FOUND", details: {} });
    }

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.securityEvent.create({
        data: {
          userId: session.userId,
          type: "SESSION_REVOKED",
          metadata: { triggeredBy: adminId, sessionId },
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.sessions.revoke",
          entity: "session",
          entityId: sessionId,
          userId: adminId,
          after: { revokedUserId: session.userId },
        },
      }),
    ]);

    return { revoked: true };
  }
}
