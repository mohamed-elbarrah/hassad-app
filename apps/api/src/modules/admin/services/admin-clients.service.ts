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
