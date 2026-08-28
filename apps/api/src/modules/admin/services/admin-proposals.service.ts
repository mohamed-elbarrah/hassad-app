import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import type { AdminProposalsQueryDto } from "../dto/admin-proposals.dto";

function addDuration(start: Date, amount: number, unit: string): Date {
  const end = new Date(start);
  if (unit === "MONTHS") end.setMonth(end.getMonth() + amount);
  else if (unit === "WEEKS") end.setDate(end.getDate() + amount * 7);
  else end.setDate(end.getDate() + amount);
  return end;
}

@Injectable()
export class AdminProposalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: AdminProposalsQueryDto) {
    const where: Prisma.ProposalWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.creatorId) where.createdBy = filters.creatorId;
    if (filters.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { client: { companyName: { contains: search, mode: "insensitive" } } },
        { request: { companyName: { contains: search, mode: "insensitive" } } },
        { request: { contactName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const page = filters.page;
    const limit = filters.limit;
    const [proposals, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          totalPrice: true,
          createdAt: true,
          client: { select: { id: true, companyName: true } },
          request: { select: { id: true, companyName: true } },
          creator: { select: { id: true, name: true } },
        },
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return {
      items: proposals.map((proposal) => ({
        ...proposal,
        totalPrice: Number(proposal.totalPrice),
        createdAt: proposal.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        serviceDescription: true,
        servicesList: true,
        totalPrice: true,
        durationDays: true,
        durationUnit: true,
        status: true,
        createdAt: true,
        sentAt: true,
        approvedAt: true,
        client: { select: { id: true, companyName: true } },
        creator: { select: { id: true, name: true, email: true } },
        request: {
          select: { id: true, companyName: true, contactName: true, status: true },
        },
        contract: { select: { id: true, title: true, status: true } },
      },
    });
    if (!proposal) throw new NotFoundException({ code: "PROPOSAL_NOT_FOUND", details: {} });

    return {
      ...proposal,
      // Prisma Decimal values must be converted before the response reaches JSON.
      totalPrice: Number(proposal.totalPrice),
      // Do not expose shareLinkToken or internal storage paths to dashboard clients.
      createdAt: proposal.createdAt.toISOString(),
      sentAt: proposal.sentAt?.toISOString() ?? null,
      approvedAt: proposal.approvedAt?.toISOString() ?? null,
    };
  }

  async getActorCapabilities(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true, permissions: { select: { permission: { select: { name: true } } } } } },
        permissions: { select: { permission: { select: { name: true } } } },
      },
    });
    const permissions = new Set([
      ...(user?.role?.permissions.map(({ permission }) => permission.name) ?? []),
      ...(user?.permissions.map(({ permission }) => permission.name) ?? []),
    ]);
    return { canIntervene: user?.role?.name === "ADMIN" || permissions.has("admin.proposals.intervene") };
  }

  async convertToContract(id: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, clientId: true, requestId: true, durationDays: true, durationUnit: true, totalPrice: true, servicesList: true, request: { select: { clientId: true } } },
    });
    if (!proposal) throw new NotFoundException({ code: "PROPOSAL_NOT_FOUND", details: {} });
    if (proposal.status !== "APPROVED") throw new BadRequestException({ code: "PROPOSAL_MUST_BE_APPROVED", details: { status: proposal.status } });

    const existingContract = await this.prisma.contract.findUnique({ where: { proposalId: id }, select: { id: true } });
    if (existingContract) throw new BadRequestException({ code: "PROPOSAL_ALREADY_CONVERTED", details: { contractId: existingContract.id } });

    const clientId = proposal.clientId ?? proposal.request?.clientId;
    if (!clientId) throw new BadRequestException({ code: "PROPOSAL_CLIENT_REQUIRED", details: {} });

    const contract = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contract.create({
        data: {
          clientId, proposalId: proposal.id, requestId: proposal.requestId, createdBy: userId, title: proposal.title,
          type: "FIXED_PROJECT", status: "DRAFT", startDate: new Date(),
          endDate: addDuration(new Date(), proposal.durationDays, proposal.durationUnit),
          totalValue: proposal.totalPrice, monthlyValue: 0, servicesList: proposal.servicesList, currency: "SAR",
        },
        select: { id: true },
      });
      await tx.ledger.create({ data: { action: "admin.proposals.convert_to_contract", entity: "proposal", entityId: id, userId, after: { contractId: created.id } } });
      return created;
    });
    return { code: "PROPOSAL_CONVERTED_TO_CONTRACT", contractId: contract.id };
  }

  async getStats() {
    const [total, sent, approved, rejected, revisionRequested, value] = await Promise.all([
      this.prisma.proposal.count(),
      this.prisma.proposal.count({ where: { status: "SENT" } }),
      this.prisma.proposal.count({ where: { status: "APPROVED" } }),
      this.prisma.proposal.count({ where: { status: "REJECTED" } }),
      this.prisma.proposal.count({ where: { status: "REVISION_REQUESTED" } }),
      this.prisma.proposal.aggregate({ _sum: { totalPrice: true } }),
    ]);
    return { total, sent, approved, rejected, revisionRequested, value: Number(value._sum.totalPrice ?? 0), conversionRate: total ? Math.round((approved / total) * 100) : 0 };
  }
}
