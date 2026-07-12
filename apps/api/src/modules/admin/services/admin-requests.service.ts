import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminActionLogService } from "./admin-action-log.service";

@Injectable()
export class AdminRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: "insensitive" } },
        {
          client: {
            companyName: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }
    if (query.assigneeId) where.assignedTo = query.assigneeId;
    if (query.status) where.status = query.status;
    if (query.clientId) where.clientId = query.clientId;

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { companyName: true } },
          assignee: { select: { id: true, name: true } },
          services: { include: { service: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.request.count({ where }),
    ]);

    const now = new Date();
    return {
      items: items.map((r) => ({
        id: r.id,
        clientName: r.client?.companyName ?? "—",
        assigneeId: r.assignedSalesId ?? null,
        assigneeName: r.assignee?.name ?? "—",
        status: r.status,
        servicesCount: r.services.length,
        ageDays: Math.floor(
          (now.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true } },
        assignee: { select: { id: true, name: true, email: true } },
        services: { include: { service: true } },
        statusHistory: { orderBy: { changedAt: "desc" } },
      },
    });
    if (!request) throw new NotFoundException("Request not found");
    return request;
  }

  async reassign(requestId: string, assigneeId: string, adminId: string, reason?: string) {
    const [request, user] = await Promise.all([
      this.prisma.request.findUnique({ where: { id: requestId } }),
      this.prisma.user.findUnique({ where: { id: assigneeId } }),
    ]);
    if (!request) throw new NotFoundException("Request not found");
    if (!user) throw new NotFoundException("User not found");

    const before = { assignedSalesId: request.assignedSalesId };
    const after = { assignedSalesId: assigneeId, reason };

    await this.prisma.$transaction([
      this.prisma.request.update({
        where: { id: requestId },
        data: { assignedSalesId: assigneeId },
      }),
      this.prisma.requestStatusHistory.create({
        data: {
          requestId,
          fromStatus: request.status,
          toStatus: request.status,
          changedBy: adminId,
          note: reason,
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.requests.reassign",
          entity: "request",
          entityId: requestId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "request",
      targetId: requestId,
      actionType: "admin.requests.reassign",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { success: true };
  }

  async forceStatus(requestId: string, status: any, reason: string, adminId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException("Request not found");

    const before = { status: request.status };
    const after = { status, reason };

    await this.prisma.$transaction([
      this.prisma.request.update({
        where: { id: requestId },
        data: { status: status as any },
      }),
      this.prisma.requestStatusHistory.create({
        data: {
          requestId,
          fromStatus: request.status,
          toStatus: status,
          changedBy: adminId,
          note: reason,
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.requests.force-status",
          entity: "request",
          entityId: requestId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "request",
      targetId: requestId,
      actionType: "admin.requests.force-status",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { success: true };
  }

  async getStaleRequests(days = 7, page = 1, limit = 20) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { assignedSalesId: null },
        {
          status: { in: ["SUBMITTED", "QUALIFYING"] },
          createdAt: { lt: since },
        },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { companyName: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        clientName: r.client?.companyName ?? "—",
        assigneeName: r.assignee?.name ?? "—",
        status: r.status,
        ageDays: Math.floor((Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateNotes(requestId: string, notes: string, adminId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException("Request not found");

    const before = { internalNotes: request.internalNotes };
    const after = { internalNotes: notes };

    const updated = await this.prisma.request.update({
      where: { id: requestId },
      data: { internalNotes: notes },
    });

    await this.prisma.ledger.create({
      data: {
        action: "admin.requests.update-notes",
        entity: "request",
        entityId: requestId,
        userId: adminId,
        before,
        after,
      },
    });

    await this.actionLog.record({
      actorId: adminId,
      targetType: "request",
      targetId: requestId,
      actionType: "admin.requests.update-notes",
      beforeState: before,
      afterState: after,
    });

    return updated;
  }
}
