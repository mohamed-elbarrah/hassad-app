import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminActionLogService {
  constructor(private prisma: PrismaService) {}

  async record(params: {
    actorId: string;
    targetType: string;
    targetId: string;
    actionType: string;
    reason?: string;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
  }) {
    const {
      actorId,
      targetType,
      targetId,
      actionType,
      reason,
      beforeState,
      afterState,
    } = params;

    return this.prisma.adminActionLog.create({
      data: {
        actorId,
        targetType,
        targetId,
        actionType,
        reason: reason ?? null,
        beforeState: beforeState as any,
        afterState: afterState as any,
      },
    });
  }

  async findByTarget(targetType: string, targetId: string) {
    return this.prisma.adminActionLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll(filters: {
    actorId?: string;
    targetType?: string;
    actionType?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.actionType) where.actionType = filters.actionType;

    return this.prisma.adminActionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
      include: { actor: { select: { id: true, name: true, email: true } } },
    });
  }
}
