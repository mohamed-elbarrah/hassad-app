import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuditLogQueryDto } from "../dto/admin.dto";

@Injectable()
export class AdminAuditService {
  constructor(private prisma: PrismaService) {}

  async getAuditLog(query: AuditLogQueryDto) {
    const { userId, action, entity, entityId, from, to, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entity) where.entity = { contains: entity, mode: "insensitive" };
    if (entityId) where.entityId = entityId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      this.prisma.ledger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.ledger.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        entity: item.entity,
        entityId: item.entityId,
        userId: item.userId,
        userName: item.user?.name ?? null,
        userEmail: item.user?.email ?? null,
        before: item.before,
        after: item.after,
        metadata: item.metadata,
        createdAt: item.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Write an audit log entry — used by controllers/services throughout the app */
  async write(entry: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string;
    before?: any;
    after?: any;
    metadata?: any;
  }) {
    return this.prisma.ledger.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId ?? null,
        before: entry.before ?? undefined,
        after: entry.after ?? undefined,
        metadata: entry.metadata ?? undefined,
      },
    });
  }

  /** Get available filter values for dropdowns */
  async getFilterOptions() {
    const [actions, entities, users] = await Promise.all([
      this.prisma.ledger.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
        take: 100,
      }),
      this.prisma.ledger.findMany({
        select: { entity: true },
        distinct: ["entity"],
        orderBy: { entity: "asc" },
        take: 50,
      }),
      this.prisma.ledger.findMany({
        select: {
          user: { select: { id: true, name: true } },
        },
        where: { userId: { not: null } },
        distinct: ["userId"],
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return {
      actions: actions.map((a) => a.action),
      entities: entities.map((e) => e.entity),
      users: users
        .filter((u) => u.user)
        .map((u) => ({ id: u.user!.id, name: u.user!.name })),
    };
  }
}
