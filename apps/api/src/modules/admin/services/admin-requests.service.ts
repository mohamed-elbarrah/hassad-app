import { Injectable, NotFoundException } from "@nestjs/common";
import { RequestStatus } from "@hassad/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminActionLogService } from "./admin-action-log.service";
import { RequestsService } from "../../requests/requests.service";
import type { AdminRequestContactLogDto } from "../dto/admin-requests.dto";
import type { AdminRequestQueryDto } from "../dto/admin-requests.dto";

@Injectable()
export class AdminRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionLog: AdminActionLogService,
    private readonly requestsService: RequestsService,
  ) {}

  async findAll(query: AdminRequestQueryDto) {
    const where: Prisma.RequestWhereInput = {};
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: "insensitive" } },
        { contactName: { contains: query.search, mode: "insensitive" } },
        { companyName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        {
          client: {
            companyName: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }
    if (query.assigneeId) where.assignedSalesId = query.assigneeId;
    if (query.status) where.status = query.status;
    if (query.clientId) where.clientId = query.clientId;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
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
        contactName: r.contactName,
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

  async findOne(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { role: { select: { name: true, permissions: { select: { permission: { select: { name: true } } } } } }, permissions: { select: { permission: { select: { name: true } } } } },
    });
    const canIntervene = user?.role?.name === "ADMIN" || Boolean(user?.role?.permissions.some(({ permission }) => permission.name === "admin.requests.intervene") || user?.permissions.some(({ permission }) => permission.name === "admin.requests.intervene"));
    const request = await this.requestsService.findOne(id, {
      canLogContact: canIntervene,
      canUpdateStatus: canIntervene,
    });

    // The shared request service returns Prisma Decimal instances for related
    // financial records; normalize them at the Admin API boundary.
    return {
      ...request,
      proposals: request.proposals.map((proposal) => ({
        ...proposal,
        totalPrice: Number(proposal.totalPrice),
      })),
      contracts: request.contracts.map((contract) => ({
        ...contract,
        totalValue: Number(contract.totalValue),
      })),
    };
  }

  async addContactLog(requestId: string, adminId: string, dto: AdminRequestContactLogDto) {
    await this.requestsService.addContactLog(requestId, adminId, dto);
    return { code: "REQUEST_CONTACT_LOGGED", requestId };
  }

  async reassign(
    requestId: string,
    assigneeId: string,
    adminId: string,
    reason?: string,
  ) {
    const [request, user] = await Promise.all([
      this.prisma.request.findUnique({ where: { id: requestId } }),
      this.prisma.user.findUnique({ where: { id: assigneeId } }),
    ]);
    if (!request) throw new NotFoundException({ code: "REQUEST_NOT_FOUND", details: { id: requestId } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: { id: assigneeId } });

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

    return { code: "REQUEST_REASSIGNED", requestId };
  }

  async forceStatus(
    requestId: string,
    status: RequestStatus,
    reason: string,
    adminId: string,
  ) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException({ code: "REQUEST_NOT_FOUND", details: { id: requestId } });

    const before = { status: request.status };
    const after = { status, reason };

    await this.prisma.$transaction([
      this.prisma.request.update({
        where: { id: requestId },
        data: { status: status as RequestStatus },
      }),
      this.prisma.requestStatusHistory.create({
        data: {
          requestId,
          fromStatus: request.status,
          toStatus: status as RequestStatus,
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

    return { code: "REQUEST_STATUS_FORCED", requestId };
  }

  async getStaleRequests(days = 7, page = 1, limit = 20) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const skip = (page - 1) * limit;

    const where: Prisma.RequestWhereInput = {
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
        ageDays: Math.floor(
          (Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
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
    if (!request) throw new NotFoundException({ code: "REQUEST_NOT_FOUND", details: { id: requestId } });

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
