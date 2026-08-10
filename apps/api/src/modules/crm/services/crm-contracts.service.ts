import { Injectable, NotFoundException } from "@nestjs/common";

import { ContractStatus } from "@hassad/shared";
import { PrismaService } from "../../../prisma/prisma.service";

import { CrmContractsWorkspaceQueryDto } from "../dto/crm-contracts.dto";

@Injectable()
export class CrmContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CrmContractsWorkspaceQueryDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        {
          client: {
            companyName: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }

    if (query.status && query.status !== "all") {
      where.status =
        query.status === "on-hold"
          ? "ON_HOLD"
          : query.status.toUpperCase();
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.expiringDays) {
      const now = new Date();
      const future = new Date(
        now.getTime() + Number.parseInt(query.expiringDays, 10) * 24 * 60 * 60 * 1000,
      );
      where.endDate = { gte: now, lte: future };
      where.status = ContractStatus.ACTIVE;
    }

    const page = query.page ? Number.parseInt(query.page, 10) : 1;
    const limit = query.limit ? Number.parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { companyName: true } },
          renewalAlerts: { where: { isSent: false }, select: { id: true } },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { invoices: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        title: c.title,
        clientName: c.client?.companyName ?? "—",
        type: c.type,
        status: c.status,
        monthlyValue: c.monthlyValue,
        totalValue: c.totalValue,
        currency: c.currency,
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        signedAt: c.signedAt?.toISOString() ?? null,
        versionNumber: c.versionNumber,
        eSigned: c.eSigned,
        pendingRenewalAlerts: c.renewalAlerts.length,
        invoiceCount: c._count.invoices,
        project: c.projects[0]
          ? {
              id: c.projects[0].id,
              name: c.projects[0].name,
              status: c.projects[0].status,
            }
          : null,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true, userId: true } },
        versions: { orderBy: { versionNumber: "desc" } },
        paymentPlans: { include: { invoices: true } },
        renewalAlerts: { orderBy: { scheduledAt: "desc" } },
        statusHistory: { orderBy: { changedAt: "desc" } },
        invoices: {
          include: { items: true, payments: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException("Contract not found");
    }

    const project = await this.prisma.project.findFirst({
      where: { contractId: id },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        manager: { select: { id: true, name: true } },
      },
    });

    return { ...contract, project };
  }
}
