import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminActionLogService } from "./admin-action-log.service";
import {
  AdminClientActivityResponse,
  QueryClientUsersDto,
} from "../dto/admin-clients.dto";

@Injectable()
export class AdminClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  async findClientUsers(query: QueryClientUsersDto) {
    const conditions: any[] = [{ role: { name: "CLIENT" } }];

    if (query.search) {
      conditions.push({
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      });
    }

    if (query.segment === "new") {
      conditions.push({ clientProfile: { activeProjects: 0 } });
    } else if (query.segment === "active") {
      conditions.push({ clientProfile: { activeProjects: { gt: 0 } } });
    } else if (query.segment === "stopped") {
      conditions.push({ clientProfile: { status: "SUSPENDED" } });
    }

    if (query.kind) {
      conditions.push({ clientProfile: { kind: query.kind } });
    }
    if (query.status) {
      conditions.push({ clientProfile: { status: query.status } });
    }

    const where = { AND: conditions };

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
      kind: u.clientProfile?.kind ?? "LEAD",
      status: u.clientProfile?.status ?? "ACTIVE",
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
    const clientWhere = {};
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [total, lead, active, inactive, newThisMonth, revenue] = await Promise.all([
      this.prisma.client.count({ where: clientWhere }),
      this.prisma.client.count({ where: { kind: "LEAD" } }),
      this.prisma.client.count({ where: { status: "ACTIVE" } }),
      this.prisma.client.count({ where: { status: "SUSPENDED" } }),
      this.prisma.client.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.client.aggregate({ _sum: { totalPaid: true } }),
    ]);

    return { total, lead, active, inactive, newThisMonth, totalRevenue: revenue._sum.totalPaid ?? 0 };
  }

  async findAll(filters: {
    search?: string;
    status?: "active" | "stopped" | "inactive" | "lead";
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const clientWhere: any = {};

    if (filters.status === "active") clientWhere.status = "ACTIVE";
    if (filters.status === "stopped" || filters.status === "inactive") clientWhere.status = "SUSPENDED";
    if (filters.status === "lead") clientWhere.kind = "LEAD";

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      clientWhere.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { businessName: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { manager: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [clientRecords, total] = await Promise.all([
      this.prisma.client.findMany({
        where: clientWhere,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          manager: { select: { id: true, name: true, email: true } },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              lastLoginAt: true,
              lastSeenAt: true,
            },
          },
          _count: { select: { contracts: true, projects: true, invoices: true } },
        },
      }),
      this.prisma.client.count({ where: clientWhere }),
    ]);

    const clientIds = clientRecords.map((client) => client.id);
    const overdueGroups = await this.prisma.invoice.groupBy({
      by: ["clientId"],
      where: { clientId: { in: clientIds }, status: { in: ["SENT", "DUE", "LATE", "PARTIAL"] } },
      _count: { id: true },
    });
    const overdueMap = new Map(overdueGroups.map((item) => [item.clientId, item._count.id]));

    const items = clientRecords.map((client) => ({
      id: client.id,
      userId: client.user?.id ?? null,
      name: client.user?.name ?? client.companyName ?? client.businessName,
      email: client.user?.email ?? null,
      isActive: client.user?.isActive ?? true,
      lastActiveAt: client.user?.lastSeenAt?.toISOString() ?? client.user?.lastLoginAt?.toISOString() ?? null,
      status: client.status,
      kind: client.kind,
      businessType: client.businessType,
      createdAt: client.createdAt.toISOString(),
      companyName: client.companyName ?? client.businessName ?? "—",
      businessName: client.businessName ?? null,
      manager: client.manager,
      portalAccess: !!client.portalAccessToken,
      contractsCount: client._count.contracts,
      projectsCount: client._count.projects,
      invoicesCount: client._count.invoices,
      totalRevenue: client.totalPaid ?? 0,
      activeProjects: client.activeProjects ?? 0,
      completedProjects: client.completedProjects ?? 0,
      totalContractValue: client.totalContractValue ?? 0,
      overdueInvoicesCount: overdueMap.get(client.id) ?? 0,
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
    if (!user)
      throw new NotFoundException({ code: "CLIENT_NOT_FOUND", details: {} });

    const profile = user.clientProfile;

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
      portalAccess: !!profile?.portalAccessToken,
      contractsCount: profile?._count.contracts ?? 0,
      projectsCount: profile?._count.projects ?? 0,
      invoicesCount: profile?._count.invoices ?? 0,
      manager: null,
      profile: profile ? this.sanitizeProfile(profile) : null,
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
            lastSeenAt: true,
          },
        },
        profile: true,
        requests: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { source: true },
        },
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

    if (!client)
      throw new NotFoundException({ code: "CLIENT_NOT_FOUND", details: {} });

    const [
      contracts,
      projects,
      invoices,
      payments,
      historyLogs,
      satRatings,
      avgResult,
      overdueInvoicesCount,
      signedContractValue,
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
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        take: 20,
        select: {
          id: true,
          eventType: true,
          userId: true,
          occurredAt: true,
          user: { select: { name: true, email: true } },
        },
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
      this.prisma.contract.aggregate({
        where: { clientId, status: { in: ["SIGNED", "ACTIVE", "ON_HOLD", "COMPLETED", "EXPIRED"] } },
        _sum: { totalValue: true },
      }),
    ]);

    return {
      ...this.formatClientResponse(client),
      source: client.requests[0]?.source ?? null,
      managerName: client.manager?.name ?? null,
      hasPortalAccess: !!client.portalAccessToken,
      overdueInvoicesCount,
      signedContractValue: signedContractValue._sum.totalValue ?? 0,
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
        userId: h.userId,
        userName: h.user.name,
        userEmail: h.user.email,
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

  async getHistory(
    clientId: string,
    page = 1,
    limit = 20,
  ): Promise<AdminClientActivityResponse> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client)
      throw new NotFoundException({ code: "CLIENT_NOT_FOUND", details: {} });

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.clientHistoryLog.findMany({
        where: { clientId },
        skip,
        take: limit,
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
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
    if (!client)
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        details: { clientId },
      });
    if (client.status === "SUSPENDED")
      throw new BadRequestException({
        code: "CLIENT_ALREADY_SUSPENDED",
        details: { clientId },
      });

    const before = { status: client.status, suspendedAt: client.suspendedAt };
    const after = {
      status: "SUSPENDED",
      reason,
      suspendedUntil: suspendedUntil ?? null,
    };

    await this.prisma.$transaction([
      this.prisma.client.update({
        where: { id: clientId },
        data: {
          status: "SUSPENDED",
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
          eventType: "CLIENT_SUSPENDED",
          description: "CLIENT_SUSPENDED",
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

    return { clientId, status: "SUSPENDED" };
  }

  async reactivate(clientId: string, reason: string, adminId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client)
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        details: { clientId },
      });
    if (client.status !== "SUSPENDED")
      throw new BadRequestException({
        code: "CLIENT_NOT_SUSPENDED",
        details: { clientId },
      });

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
          eventType: "CLIENT_REACTIVATED",
          description: "CLIENT_REACTIVATED",
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

    return { clientId, status: "ACTIVE" };
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
    if (!client)
      throw new NotFoundException({ code: "CLIENT_NOT_FOUND", details: {} });
    if (!manager)
      throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });

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
          eventType: "CLIENT_MANAGER_CHANGED",
          description: "CLIENT_MANAGER_CHANGED",
          metadata: {
            fromManager: before.accountManager,
            toManager: accountManagerId,
            managerName: manager.name,
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

    return { clientId, managerName: manager.name };
  }

  private formatClientResponse(client: any) {
    return {
      id: client.id,
      type: "client",
      companyName: client.companyName,
      businessName: client.businessName,
      businessType: client.businessType,
      status: client.status,
      contactName: client.user?.name ?? null,
      email: client.user?.email ?? null,
      phone: client.user?.phoneWhatsapp ?? null,
      isActive: client.user?.isActive ?? false,
      lastLoginAt: client.user?.lastLoginAt?.toISOString() ?? null,
      lastSeenAt: client.user?.lastSeenAt?.toISOString() ?? null,
      user: client.user
        ? {
            id: client.user.id,
            name: client.user.name,
            email: client.user.email,
            phoneWhatsapp: client.user.phoneWhatsapp,
            avatarUrl: client.user.avatarUrl,
          }
        : null,
      portalAccess:
        !!client.portalAccessToken ||
        !!client.user?.clientProfile?.portalAccessToken,
      intakeCompleted: client.intakeCompleted,
      avatarUrl: client.user?.avatarUrl ?? null,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      manager: client.manager,
      profile: this.sanitizeProfile(client.profile),
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

  /** Remove credentials from profiles, including values nested in JSON sections. */
  private sanitizeProfile(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeProfile(item));
    }

    if (value instanceof Date) {
      return value;
    }

    if (value && typeof value === "object") {
      const safe: Record<string, unknown> = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        if (
          key === "portalAccessToken" ||
          key === "portalTokenExpiresAt" ||
          key === "portal_access_token" ||
          key === "portal_token_expires_at"
        ) {
          continue;
        }
        safe[key] = this.sanitizeProfile(nestedValue);
      }
      return safe;
    }

    return value;
  }
}
