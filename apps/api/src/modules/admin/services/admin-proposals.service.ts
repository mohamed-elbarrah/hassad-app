import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminProposalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
        { contactEmail: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lead: { select: { id: true, companyName: true } },
          client: { select: { id: true, companyName: true } },
        },
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, companyName: true, contactName: true } },
        client: { select: { id: true, companyName: true } },
        creator: { select: { id: true, name: true, email: true } },
        request: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            status: true,
            services: { include: { service: true } },
          },
        },
      },
    });
    if (!proposal) throw new Error("العرض غير موجود");
    return proposal;
  }

  async getStats() {
    const [total, sent, approved, rejected, revisionRequested] =
      await Promise.all([
        this.prisma.proposal.count(),
        this.prisma.proposal.count({ where: { status: "SENT" } }),
        this.prisma.proposal.count({ where: { status: "APPROVED" } }),
        this.prisma.proposal.count({ where: { status: "REJECTED" } }),
        this.prisma.proposal.count({ where: { status: "REVISION_REQUESTED" } }),
      ]);
    return {
      total,
      sent,
      approved,
      rejected,
      revisionRequested,
      conversionRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  }
}
