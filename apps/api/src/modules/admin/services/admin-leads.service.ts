import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminActionLogService } from "./admin-action-log.service";
import { ClientStatus, PipelineStage } from "@prisma/client";

@Injectable()
export class AdminLeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  async findAll(query: any) {
    const where: any = { isActive: true };

    const searchOr: any[] = [];
    if (query.search) {
      searchOr.push(
        { companyName: { contains: query.search, mode: "insensitive" } },
        { contactName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      );
    }
    if (query.noContactSince) {
      const days = parseInt(query.noContactSince, 10);
      if (!isNaN(days)) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        searchOr.push(
          { lastContactAt: null },
          { lastContactAt: { lt: since } },
        );
      }
    }
    if (searchOr.length > 0) where.OR = searchOr;

    if (query.assigneeId) where.assignedTo = query.assigneeId;
    if (query.stage) where.pipelineStage = query.stage;
    if (query.source) where.source = query.source;
    if (query.businessType) where.businessType = query.businessType;

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        include: {
          assignee: { select: { id: true, name: true } },
          proposals: { select: { totalPrice: true }, take: 1 },
          _count: { select: { proposals: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: items.map((l) => ({
        id: l.id,
        companyName: l.companyName,
        contactName: l.contactName,
        email: l.email,
        phone: l.phoneWhatsapp,
        assigneeId: l.assignedTo ?? null,
        assigneeName: l.assignee?.name ?? "—",
        pipelineStage: l.pipelineStage,
        source: l.source,
        businessType: l.businessType,
        contactAttemptCount: l.contactAttemptCount,
        lastContactAt: l.lastContactAt?.toISOString() ?? null,
        createdAt: l.createdAt.toISOString(),
        potentialValue: l.proposals?.[0]?.totalPrice ?? null,
        daysSinceLastContact: l.lastContactAt
          ? Math.floor(
              (Date.now() - new Date(l.lastContactAt).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null,
        hasProposal: (l._count?.proposals ?? 0) > 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        contactLogs: { orderBy: { contactedAt: "desc" }, take: 20 },
        pipelineHistory: { orderBy: { changedAt: "desc" }, take: 20 },
        services: { include: { service: true } },
        automationLogs: { orderBy: { executedAt: "desc" }, take: 20 },
        client: { select: { id: true } },
        proposals: {
          select: {
            id: true,
            title: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  async convertToClient(
    leadId: string,
    userId: string,
    additionalNotes?: string,
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { client: { select: { id: true } } },
    });
    if (!lead) throw new NotFoundException("Lead not found");
    if (lead.client)
      throw new BadRequestException("Lead already converted to a client");

    const result = await this.prisma.$transaction(async (tx) => {
      const newClient = await tx.client.create({
        data: {
          companyName: lead.companyName,
          businessName: lead.businessName,
          businessType: lead.businessType,
          status: ClientStatus.ACTIVE,
          leadId: lead.id,
          accountManager: lead.assignedTo,
        },
      });

      await tx.clientHistoryLog.create({
        data: {
          clientId: newClient.id,
          userId,
          eventType: "lead_converted",
          description: additionalNotes
            ? `تم تحويل العميل المحتمل إلى عميل - ${additionalNotes}`
            : "تم تحويل العميل المحتمل إلى عميل",
          metadata: { leadId: lead.id, companyName: lead.companyName },
        },
      });

      await tx.ledger.create({
        data: {
          action: "admin.leads.convert-to-client",
          entity: "lead",
          entityId: leadId,
          userId,
          after: { clientId: newClient.id, companyName: lead.companyName },
        },
      });

      return newClient;
    });

    await this.actionLog.record({
      actorId: userId,
      targetType: "lead",
      targetId: leadId,
      actionType: "admin.leads.convert-to-client",
      afterState: { clientId: result.id, companyName: lead.companyName },
    });

    return result;
  }

  async reassign(
    leadId: string,
    assigneeId: string,
    adminId: string,
    reason?: string,
  ) {
    const [lead, user] = await Promise.all([
      this.prisma.lead.findUnique({ where: { id: leadId } }),
      this.prisma.user.findUnique({ where: { id: assigneeId } }),
    ]);
    if (!lead) throw new NotFoundException("Lead not found");
    if (!user) throw new NotFoundException("User not found");

    const before = { assignedTo: lead.assignedTo };
    const after = { assignedTo: assigneeId, reason };

    await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id: leadId },
        data: { assignedTo: assigneeId },
      }),
      this.prisma.leadPipelineHistory.create({
        data: {
          leadId,
          fromStage: lead.pipelineStage,
          toStage: lead.pipelineStage,
          changedBy: adminId,
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.leads.reassign",
          entity: "lead",
          entityId: leadId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "lead",
      targetId: leadId,
      actionType: "admin.leads.reassign",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { success: true };
  }

  async getStats() {
    const [byStage, bySource, total, converted] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ["pipelineStage"],
        _count: true,
        where: { isActive: true },
      }),
      this.prisma.lead.groupBy({
        by: ["source"],
        _count: true,
        where: { isActive: true },
      }),
      this.prisma.lead.count({ where: { isActive: true } }),
      this.prisma.client.count(),
    ]);

    return {
      byStage: byStage.map((s) => ({
        stage: s.pipelineStage,
        count: s._count,
      })),
      bySource: bySource.map((s) => ({ source: s.source, count: s._count })),
      conversionRate:
        total > 0 ? Math.round((converted / total) * 100 * 10) / 10 : 0,
    };
  }

  async addContactLog(
    leadId: string,
    userId: string,
    body: {
      type: string;
      result: string;
      notes?: string;
      contactedAt?: string;
    },
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException("Lead not found");

    const log = await this.prisma.leadContactLog.create({
      data: {
        leadId,
        userId,
        type: body.type as any,
        result: body.result as any,
        notes: body.notes,
        contactedAt: body.contactedAt ? new Date(body.contactedAt) : new Date(),
      },
      include: { user: { select: { name: true } } },
    });

    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        lastContactAt: new Date(),
        contactAttemptCount: { increment: 1 },
      },
    });

    await this.prisma.ledger.create({
      data: {
        action: "admin.leads.contact-log",
        entity: "lead",
        entityId: leadId,
        userId,
        after: { type: body.type, result: body.result },
      },
    });

    await this.actionLog.record({
      actorId: userId,
      targetType: "lead",
      targetId: leadId,
      actionType: "admin.leads.contact-log",
      afterState: { type: body.type, result: body.result, notes: body.notes },
    });

    return log;
  }

  async forceStage(
    leadId: string,
    stage: PipelineStage,
    reason: string,
    adminId: string,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException("Lead not found");

    const before = { pipelineStage: lead.pipelineStage };
    const after = { pipelineStage: stage, reason };

    await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id: leadId },
        data: { pipelineStage: stage },
      }),
      this.prisma.leadPipelineHistory.create({
        data: {
          leadId,
          fromStage: lead.pipelineStage,
          toStage: stage,
          changedBy: adminId,
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.leads.force-stage",
          entity: "lead",
          entityId: leadId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "lead",
      targetId: leadId,
      actionType: "admin.leads.force-stage",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { success: true };
  }

  async getStaleLeads(days = 7, page = 1, limit = 20) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      OR: [
        { assignedTo: null },
        { lastContactAt: null },
        { lastContactAt: { lt: since } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        include: {
          assignee: { select: { id: true, name: true } },
          _count: { select: { proposals: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: items.map((l) => ({
        id: l.id,
        companyName: l.companyName,
        contactName: l.contactName,
        email: l.email,
        phone: l.phoneWhatsapp,
        assigneeName: l.assignee?.name ?? "—",
        pipelineStage: l.pipelineStage,
        source: l.source,
        daysSinceLastContact: l.lastContactAt
          ? Math.floor(
              (Date.now() - new Date(l.lastContactAt).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
