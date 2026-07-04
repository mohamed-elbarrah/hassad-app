import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { search?: string; status?: string; page?: number; limit?: number }) {
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
        where: { ...where, roleId: { not: undefined } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          clientProfile: {
            select: {
              id: true, companyName: true, businessName: true,
              portalAccessToken: true,
              _count: { select: { contracts: true, projects: true, invoices: true } },
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
      companyName: u.clientProfile?.companyName ?? u.clientProfile?.businessName ?? "—",
      portalAccess: !!u.clientProfile?.portalAccessToken,
      contractsCount: u.clientProfile?._count.contracts ?? 0,
      projectsCount: u.clientProfile?._count.projects ?? 0,
      invoicesCount: u.clientProfile?._count.invoices ?? 0,
      totalRevenue: 0,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        clientProfile: {
          include: {
            _count: { select: { contracts: true, projects: true, invoices: true } },
            contracts: { take: 5, orderBy: { createdAt: "desc" } },
            projects: { take: 5, orderBy: { createdAt: "desc" } },
            invoices: { take: 5, orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
    if (!user || !user.clientProfile) throw new Error("العميل غير موجود");

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      companyName: user.clientProfile.companyName ?? user.clientProfile.businessName ?? "—",
      portalAccess: !!user.clientProfile.portalAccessToken,
      contractsCount: user.clientProfile._count.contracts,
      projectsCount: user.clientProfile._count.projects,
      invoicesCount: user.clientProfile._count.invoices,
      recentContracts: user.clientProfile.contracts,
      recentProjects: user.clientProfile.projects,
      recentInvoices: user.clientProfile.invoices,
    };
  }
}
