import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminProposalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    status?: string;
    search?: string;
    clientId?: string;
    creatorId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters.creatorId) {
      where.createdBy = filters.creatorId;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
        { contactEmail: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lead: { select: { id: true, companyName: true } },
          client: { select: { id: true, companyName: true } },
          creator: { select: { id: true, name: true } },
          request: {
            select: {
              id: true,
              companyName: true,
              services: {
                include: {
                  service: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          contract: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
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
    if (!proposal) throw new NotFoundException("العرض غير موجود");

    const contract = await this.prisma.contract.findFirst({
      where: { proposalId: id },
      select: { id: true, title: true, status: true },
    });

    return { ...proposal, contract };
  }

  async convertToContract(id: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        lead: { include: { client: { select: { id: true } } } },
      },
    });
    if (!proposal) throw new NotFoundException("العرض غير موجود");
    if (proposal.status !== "APPROVED") {
      throw new BadRequestException("يمكن تحويل العروض المقبولة فقط إلى عقود");
    }

    const existingContract = await this.prisma.contract.findUnique({
      where: { proposalId: id },
      select: { id: true },
    });
    if (existingContract) {
      throw new BadRequestException("تم تحويل هذا العرض إلى عقد مسبقاً");
    }

    const clientId = proposal.clientId ?? proposal.lead?.client?.id;
    if (!clientId) {
      throw new BadRequestException(
        "يجب أن يكون للعميل عميل مرتبط لتحويل العرض إلى عقد",
      );
    }

    const contract = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contract.create({
        data: {
          clientId,
          proposalId: proposal.id,
          createdBy: userId,
          title: proposal.title,
          type: "FIXED_PROJECT" as any,
          status: "DRAFT" as any,
          startDate: proposal.startDate ?? new Date(),
          endDate: new Date(
            (proposal.startDate ?? new Date()).getTime() +
              proposal.durationDays * 24 * 60 * 60 * 1000,
          ),
          totalValue: proposal.totalPrice,
          monthlyValue: 0,
          servicesList: proposal.servicesList,
          currency: "SAR",
        },
      });

      await tx.ledger.create({
        data: {
          action: "admin.proposals.convert_to_contract",
          entity: "proposal",
          entityId: id,
          userId,
          after: { contractId: created.id },
        },
      });

      return created;
    });

    return contract;
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
