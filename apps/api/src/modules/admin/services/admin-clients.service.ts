import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminActionLogService } from "./admin-action-log.service";
import { QueryClientUsersDto } from "../dto/admin-clients.dto";

@Injectable()
export class AdminClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  async findClientUsers(query: QueryClientUsersDto) {
    const where: any = {
      role: { name: "CLIENT" },
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.segment === "new") {
      where.clientProfile = { activeProjects: 0 };
    } else if (query.segment === "active") {
      where.clientProfile = { activeProjects: { gt: 0 } };
    } else if (query.segment === "stopped") {
      where.clientProfile = { status: "STOPPED" };
    }

    if (query.status) {
      where.clientProfile = { ...(where.clientProfile || {}), status: query.status };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          clientProfile: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mapped = items.map((u) => ({
      id: u.id,
      clientId: u.clientProfile?.id ?? null,
      name: u.name,
      email: u.email,
      companyName: u.clientProfile?.companyName ?? null,
      businessType: u.clientProfile?.businessType ?? null,
      status: u.clientProfile?.status ?? "LEAD",
      portalAccess: u.clientProfile?.portalAccessToken ? true : false,
      totalProjects: u.clientProfile?.totalProjects ?? 0,
      activeProjects: u.clientProfile?.activeProjects ?? 0,
      totalPaid: u.clientProfile?.totalPaid ?? 0,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    }));

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [totalClients, activeClients, inactiveClients, newThisMonth] =
      await Promise.all([
        this.prisma.client.count(),
        this.prisma.client.count({ where: { status: "ACTIVE" } }),
        this.prisma.client.count({ where: { status: "STOPPED" } }),
        this.prisma.client.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

    return {
      total: totalClients,
      active: activeClients,
      inactive: inactiveClients,
      newThisMonth,
    };
  }

  async findAll(filters: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;

    const userWhere: any = {};
    const clientWhere: any = {};

    if (filters.status) {
      if (filters.status === "active") {
        clientWhere.status = "ACTIVE";
      } else if (
        filters.status === "stopped" ||
        filters.status === "inactive"
      ) {
        clientWhere.status = "STOPPED";
      } else if (filters.status === "lead") {
        clientWhere.status = "LEAD";
      }
    }

    if (filters.search) {
      userWhere.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const searchFilter: any = {};
    if (filters.search) {
      searchFilter.user = {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      };
    }

    const clientRecords = await this.prisma.client.findMany({
      where: { ...clientWhere, ...searchFilter },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        _count: { select: { contracts: true, projects: true, invoices: true } },
      },
    });

    const total =
      clientRecords.length < limit && page === 1
        ? clientRecords.length
        : await this.prisma.client.count({
            where: { ...clientWhere, ...searchFilter },
          });

    const clientIdList = clientRecords.map((c) => c.id);

    const overdueGroups = await this.prisma.invoice.groupBy({
      by: ["clientId"],
      where: {
        clientId: { in: clientIdList },
        status: { in: ["SENT", "DUE", "LATE", "PARTIAL"] },
      },
      _count: { id: true },
    });
    const overdueMap = new Map(
      overdueGroups.map((o) => [o.clientId, o._count.id]),
    );

    const items = clientRecords.map((c) => ({
      id: c.user?.id ?? c.id,
      name: c.user?.name ?? c.companyName,
      email: c.user?.email ?? null,
      isActive: c.user?.isActive ?? true,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      companyName: c.companyName ?? c.businessName ?? "—",
      portalAccess: !!c.portalAccessToken,
      contractsCount: c._count.contracts ?? 0,
      projectsCount: c._count.projects ?? 0,
      invoicesCount: c._count.invoices ?? 0,
      totalRevenue: c.totalPaid ?? 0,
      activeProjects: c.activeProjects ?? 0,
      completedProjects: c.completedProjects ?? 0,
      totalContractValue: c.totalContractValue ?? 0,
      overdueInvoicesCount: overdueMap.get(c.id) ?? 0,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneWhatsapp: true,
            avatarUrl: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        profile: true,
        _count: {
          select: {
            contracts: true,
            projects: true,
            invoices: true,
            payments: true,
            proposals: true,
            requests: true,
          },
        },
      },
    });

    if (client) {
      return this.formatClientResponse(client);
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        clientProfile: {
          include: {
            _count: {
              select: { contracts: true, projects: true, invoices: true },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException("العميل غير موجود");

    return {
      id: user.id,
      type: "user",
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      companyName:
        user.clientProfile?.companyName ??
        user.clientProfile?.businessName ??
        "—",
      portalAccess: !!user.clientProfile?.portalAccessToken,
      contractsCount: user.clientProfile?._count.contracts ?? 0,
      projectsCount: user.clientProfile?._count.projects ?? 0,
      invoicesCount: user.clientProfile?._count.invoices ?? 0,
      manager: null,
      profile: user.clientProfile,
      counters: {
        payments: 0,
        proposals: 0,
        requests: 0,
      },
    };
  }

  async getFull(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneWhatsapp: true,
            avatarUrl: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        profile: true,
        lead: { select: { source: true } },
        _count: {
          select: {
            contracts: true,
            projects: true,
            invoices: true,
            payments: true,
            proposals: true,
            requests: true,
          },
        },
      },
    });

    if (!client) throw new NotFoundException("العميل غير موجود");

    const [
      contracts,
      projects,
      invoices,
      payments,
      historyLogs,
      satRatings,
      avgResult,
      overdueInvoicesCount,
    ] = await Promise.all([
      this.prisma.contract.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          totalValue: true,
          monthlyValue: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          type: true,
          currency: true,
          _count: { select: { invoices: true } },
        },
      }),
      this.prisma.project.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          status: true,
          completionPercentage: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          manager: { select: { id: true, name: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          issueDate: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
          payments: {
            select: { id: true, amount: true, status: true, createdAt: true },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
          invoice: { select: { id: true, invoiceNumber: true } },
        },
      }),
      this.prisma.clientHistoryLog.findMany({
        where: { clientId },
        orderBy: { occurredAt: "desc" },
        take: 20,
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.satisfactionRating.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.satisfactionRating.aggregate({
        where: { clientId },
        _avg: { score: true },
      }),
      this.prisma.invoice.count({
        where: { clientId, status: { in: ["SENT", "DUE", "LATE", "PARTIAL"] } },
      }),
    ]);

    return {
      ...this.formatClientResponse(client),
      source: client.lead?.source ?? null,
      portalToken: client.portalAccessToken,
      portalTokenExpiresAt: client.portalTokenExpiresAt?.toISOString() ?? null,
      managerName: client.manager?.name ?? null,
      hasPortalAccess: !!client.portalAccessToken,
      overdueInvoicesCount,
      contracts: contracts.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        totalValue: c.totalValue,
        monthlyValue: c.monthlyValue,
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        type: c.type,
        currency: c.currency,
        invoiceCount: c._count.invoices,
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        completionPercentage: p.completionPercentage,
        pmName: p.manager?.name ?? null,
        pmId: p.manager?.id ?? null,
        startDate: p.startDate?.toISOString() ?? null,
        endDate: p.endDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        remainingAmount:
          inv.amount -
          inv.payments
            .filter((pm) => pm.status === "SUCCESS")
            .reduce((sum, pm) => sum + pm.amount, 0),
        status: inv.status,
        issueDate: inv.issueDate?.toISOString() ?? null,
        dueDate: inv.dueDate?.toISOString() ?? null,
        paidAt: inv.paidAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
        payments: inv.payments.map((pm) => ({
          id: pm.id,
          amount: pm.amount,
          status: pm.status,
          createdAt: pm.createdAt.toISOString(),
        })),
      })),
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        invoiceNumber: p.invoice?.invoiceNumber ?? null,
        invoiceId: p.invoice?.id ?? null,
      })),
      historyLogs: historyLogs.map((h) => ({
        id: h.id,
        eventType: h.eventType,
        description: h.description,
        userId: h.userId,
        userName: h.user?.name ?? null,
        occurredAt: h.occurredAt.toISOString(),
      })),
      satRatings: satRatings.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      avgSatisfactionScore: avgResult._avg.score ?? null,
    };
  }

  async getHistory(clientId: string, page = 1, limit = 20) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) throw new NotFoundException("العميل غير موجود");

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.clientHistoryLog.findMany({
        where: { clientId },
        skip,
        take: limit,
        orderBy: { occurredAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.clientHistoryLog.count({ where: { clientId } }),
    ]);

    return {
      items: items.map((h) => ({
        id: h.id,
        eventType: h.eventType,
        description: h.description,
        metadata: h.metadata,
        userId: h.userId,
        userName: h.user?.name ?? null,
        userEmail: h.user?.email ?? null,
        occurredAt: h.occurredAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async suspend(
    clientId: string,
    reason: string,
    adminId: string,
    suspendedUntil?: string,
  ) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) throw new NotFoundException("العميل غير موجود");
    if (client.status === "STOPPED")
      throw new BadRequestException("العميل موقوف بالفعل");

    const before = { status: client.status, suspendedAt: client.suspendedAt };
    const after = {
      status: "STOPPED",
      reason,
      suspendedUntil: suspendedUntil ?? null,
    };

    await this.prisma.$transaction([
      this.prisma.client.update({
        where: { id: clientId },
        data: {
          status: "STOPPED",
          suspendedAt: new Date(),
          suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
          suspendReason: reason,
          suspendedById: adminId,
        },
      }),
      this.prisma.clientHistoryLog.create({
        data: {
          clientId,
          userId: adminId,
          eventType: "suspended",
          description: `تم إيقاف العميل - ${reason}`,
          metadata: { reason, suspendedUntil: suspendedUntil ?? null },
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.clients.suspend",
          entity: "client",
          entityId: clientId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "client",
      targetId: clientId,
      actionType: "admin.clients.suspend",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { success: true };
  }

  async reactivate(clientId: string, reason: string, adminId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) throw new NotFoundException("العميل غير موجود");
    if (client.status !== "STOPPED")
      throw new BadRequestException("العميل غير موقوف");

    const before = { status: client.status, suspendedAt: client.suspendedAt };
    const after = { status: "ACTIVE" };

    await this.prisma.$transaction([
      this.prisma.client.update({
        where: { id: clientId },
        data: {
          status: "ACTIVE",
          suspendedAt: null,
          suspendedUntil: null,
          suspendReason: null,
          suspendedById: null,
        },
      }),
      this.prisma.clientHistoryLog.create({
        data: {
          clientId,
          userId: adminId,
          eventType: "reactivated",
          description: `تم إعادة تفعيل العميل - ${reason}`,
          metadata: { reason },
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.clients.reactivate",
          entity: "client",
          entityId: clientId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "client",
      targetId: clientId,
      actionType: "admin.clients.reactivate",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { success: true };
  }

  async assignManager(
    clientId: string,
    accountManagerId: string,
    reason: string,
    adminId: string,
  ) {
    const [client, manager] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: clientId } }),
      this.prisma.user.findUnique({ where: { id: accountManagerId } }),
    ]);
    if (!client) throw new NotFoundException("العميل غير موجود");
    if (!manager) throw new NotFoundException("المستخدم غير موجود");

    const before = { accountManager: client.accountManager };
    const after = {
      accountManager: accountManagerId,
      managerName: manager.name,
    };

    await this.prisma.$transaction([
      this.prisma.client.update({
        where: { id: clientId },
        data: { accountManager: accountManagerId },
      }),
      this.prisma.clientHistoryLog.create({
        data: {
          clientId,
          userId: adminId,
          eventType: "manager_changed",
          description: `تم تغيير مدير الحساب إلى ${manager.name} - ${reason}`,
          metadata: {
            fromManager: before.accountManager,
            toManager: accountManagerId,
            reason,
          },
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.clients.assign-manager",
          entity: "client",
          entityId: clientId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "client",
      targetId: clientId,
      actionType: "admin.clients.assign-manager",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { success: true, managerName: manager.name };
  }

  private formatClientResponse(client: any) {
    return {
      id: client.id,
      type: "client",
      companyName: client.companyName,
      businessName: client.businessName,
      businessType: client.businessType,
      status: client.status,
      contactName: client.user?.name ?? client.lead?.contactName ?? null,
      email: client.user?.email ?? null,
      phone: client.user?.phoneWhatsapp ?? null,
      isActive: client.user?.isActive ?? false,
      lastLoginAt: client.user?.lastLoginAt?.toISOString() ?? null,
      portalAccess:
        !!client.portalAccessToken ||
        !!client.user?.clientProfile?.portalAccessToken,
      intakeCompleted: client.intakeCompleted,
      avatarUrl: client.user?.avatarUrl ?? null,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      manager: client.manager,
      profile: client.profile,
      counters: {
        contracts: client._count?.contracts ?? 0,
        projects: client._count?.projects ?? 0,
        invoices: client._count?.invoices ?? 0,
        payments: client._count?.payments ?? 0,
        proposals: client._count?.proposals ?? 0,
        requests: client._count?.requests ?? 0,
      },
      avgSatisfactionScore: client.avgSatisfactionScore,
      totalContractValue: client.totalContractValue,
      totalInvoiced: client.totalInvoiced,
      totalPaid: client.totalPaid,
      activeProjects: client.activeProjects,
      completedProjects: client.completedProjects,
      totalProjects: client.totalProjects,
    };
  }
}
