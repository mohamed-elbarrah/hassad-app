import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.status === "active") where.isActive = true;
    if (filters.status === "inactive") where.isActive = false;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { ...where },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          clientProfile: {
            select: {
              id: true,
              companyName: true,
              businessName: true,
              portalAccessToken: true,
              _count: {
                select: { contracts: true, projects: true, invoices: true },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt,
      companyName:
        u.clientProfile?.companyName ?? u.clientProfile?.businessName ?? "—",
      portalAccess: !!u.clientProfile?.portalAccessToken,
      contractsCount: u.clientProfile?._count.contracts ?? 0,
      projectsCount: u.clientProfile?._count.projects ?? 0,
      invoicesCount: u.clientProfile?._count.invoices ?? 0,
      totalRevenue: 0,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        user: { select: { id: true, name: true, email: true, phoneWhatsapp: true, avatarUrl: true, isActive: true, lastLoginAt: true } },
        profile: true,
        _count: {
          select: { contracts: true, projects: true, invoices: true, payments: true, proposals: true, requests: true },
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
        user: { select: { id: true, name: true, email: true, phoneWhatsapp: true, avatarUrl: true, isActive: true, lastLoginAt: true } },
        profile: true,
        _count: {
          select: { contracts: true, projects: true, invoices: true, payments: true, proposals: true, requests: true },
        },
      },
    });

    if (!client) throw new NotFoundException("العميل غير موجود");

    const [contracts, projects, invoices, payments, historyLogs, satRatings, avgResult] = await Promise.all([
      this.prisma.contract.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, status: true, totalValue: true, createdAt: true },
      }),
      this.prisma.project.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, status: true, completionPercentage: true, createdAt: true },
      }),
      this.prisma.invoice.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, invoiceNumber: true, amount: true, status: true, paidAt: true, createdAt: true },
      }),
      this.prisma.payment.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, amount: true, method: true, status: true, createdAt: true },
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
    ]);

    return {
      ...this.formatClientResponse(client),
      contracts: contracts.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        value: c.totalValue,
        createdAt: c.createdAt.toISOString(),
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        completionPercentage: p.completionPercentage,
        createdAt: p.createdAt.toISOString(),
      })),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        status: inv.status,
        paidAt: inv.paidAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
      })),
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
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
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
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
      portalAccess: !!client.portalAccessToken || !!client.user?.clientProfile?.portalAccessToken,
      intakeCompleted: client.intakeCompleted,
      avatarUrl: client.user?.avatarUrl ?? null,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      manager: client.manager,
      profile: client.profile,
      counters: {
        contracts: client._count.contracts,
        projects: client._count.projects,
        invoices: client._count.invoices,
        payments: client._count.payments,
        proposals: client._count.proposals,
        requests: client._count.requests,
      },
      avgSatisfactionScore: client.avgSatisfactionScore,
      totalContractValue: client.totalContractValue,
      totalInvoiced: client.totalInvoiced,
      totalPaid: client.totalPaid,
      activeProjects: client.activeProjects,
      completedProjects: client.completedProjects,
    };
  }
}
