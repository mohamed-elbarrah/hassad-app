import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContractStatus, RequestStatus } from "@hassad/shared";
import { randomBytes } from "crypto";

import { PrismaService } from "../../../prisma/prisma.service";
import { ApiException } from "../../../common/errors/api-error";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { RequestsService } from "../../requests/requests.service";
import {
  CrmContractsWorkspaceQueryDto,
  CrmCreateContractDto,
  CrmUpdateContractDto,
} from "../dto/crm-contracts.dto";

@Injectable()
export class CrmContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly requestsService: RequestsService,
  ) {}

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
        proposal: {
          select: {
            id: true,
            title: true,
            totalPrice: true,
            serviceDescription: true,
            servicesList: true,
            contactName: true,
            contactEmail: true,
            status: true,
            startDate: true,
            durationDays: true,
            durationUnit: true,
            platforms: true,
            offerValidityDays: true,
            filePath: true,
            requestId: true,
          },
        },
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

  async create(userId: string, dto: CrmCreateContractDto) {
    if (!dto.requestId && !dto.proposalId) {
      throw new ApiException("CONTRACT_REFERENCE_REQUIRED", "A request or proposal reference is required", 400);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const request = await this.requestsService.resolveRequestContext(
        { requestId: dto.requestId, proposalId: dto.proposalId },
        userId,
        tx,
      );

      let totalValue = dto.totalValue ?? 0;
      let monthlyValue = dto.monthlyValue ?? 0;
      let servicesList: unknown = undefined;
      let proposalSnapshot: { totalPrice?: number; servicesList?: unknown; durationDays?: number; startDate?: Date | null } | null = null;

      if (dto.proposalId) {
        proposalSnapshot = await tx.proposal.findUnique({
          where: { id: dto.proposalId },
          select: {
            totalPrice: true,
            servicesList: true,
            durationDays: true,
            startDate: true,
          },
        });
      }

      if (proposalSnapshot?.servicesList) {
        servicesList = proposalSnapshot.servicesList;
      }
      if (dto.totalValue == null && proposalSnapshot?.totalPrice != null) {
        totalValue = proposalSnapshot.totalPrice;
      }
      if (dto.monthlyValue == null && dto.type === "MONTHLY_RETAINER") {
        monthlyValue = 0;
      }

      const startDate = dto.startDate
        ? new Date(dto.startDate)
        : proposalSnapshot?.startDate
          ? new Date(proposalSnapshot.startDate)
          : new Date();
      const endDate = dto.endDate
        ? new Date(dto.endDate)
        : proposalSnapshot?.durationDays
          ? new Date(startDate.getTime() + proposalSnapshot.durationDays * 86400000)
          : new Date(startDate.getTime() + 30 * 86400000);

      const contract = await tx.contract.create({
        data: {
          requestId: request.id,
          clientId: request.clientId,
          proposalId: dto.proposalId ?? null,
          createdBy: userId,
          title: dto.title,
          type: dto.type as any,
          status: ContractStatus.DRAFT,
          startDate,
          endDate,
          monthlyValue,
          totalValue,
          filePath: dto.filePath ?? null,
          servicesList: (servicesList ?? null) as any,
          downPaymentType: dto.downPaymentType as any,
          downPaymentValue: dto.downPaymentValue ?? null,
          numberOfMonths: dto.numberOfMonths ?? null,
        },
      });

      if (dto.paymentPlan?.length) {
        await tx.contractPaymentPlan.createMany({
          data: dto.paymentPlan.map((row, index) => ({
            contractId: contract.id,
            label: row.label,
            sequence: row.sequence ?? index,
            triggerType: row.triggerType as any,
            amountType: row.amountType as any,
            amountValue: row.amountValue,
            isRecurring: row.isRecurring ?? false,
            dueOffsetDays: row.dueOffsetDays ?? 0,
          })),
        });
      }

      return contract;
    });

    return {
      contract: created,
      toast: { type: "success" as const, title: "Contract draft created", description: "Review the commercial terms before sending." },
    };
  }

  async update(id: string, dto: CrmUpdateContractDto & { filePath?: string | null }) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });

    if (!contract) {
      throw new NotFoundException("Contract not found");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contract.update({
        where: { id },
        data: {
          title: dto.title,
          type: dto.type as any,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          monthlyValue: dto.monthlyValue,
          totalValue: dto.totalValue,
          downPaymentType: dto.downPaymentType as any,
          downPaymentValue: dto.downPaymentValue,
          numberOfMonths: dto.numberOfMonths,
          filePath: dto.filePath,
        },
      });

      if (dto.paymentPlan) {
        await tx.contractPaymentPlan.deleteMany({ where: { contractId: id } });
        if (dto.paymentPlan.length > 0) {
          await tx.contractPaymentPlan.createMany({
            data: dto.paymentPlan.map((row, index) => ({
              contractId: id,
              label: row.label,
              sequence: row.sequence ?? index,
              triggerType: row.triggerType as any,
              amountType: row.amountType as any,
              amountValue: row.amountValue,
              isRecurring: row.isRecurring ?? false,
              dueOffsetDays: row.dueOffsetDays ?? 0,
            })),
          });
        }
      }

      return result;
    });

    return {
      contract: updated,
      toast: { type: "success" as const, title: "Contract updated", description: "The commercial draft has been saved." },
    };
  }

  async send(id: string, userId?: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      select: { id: true, title: true, requestId: true, createdBy: true, clientId: true },
    });

    if (!contract) {
      throw new NotFoundException("Contract not found");
    }

    const shareLinkToken = randomBytes(32).toString("hex");

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contract.update({
        where: { id },
        data: {
          status: ContractStatus.SENT,
          shareLinkToken,
        },
      });

      if (contract.requestId) {
        await this.requestsService.updateStatus(
          contract.requestId,
          RequestStatus.CONTRACT_SENT,
          userId ?? contract.createdBy,
          undefined,
          tx,
        );
      }

      return result;
    });

    const client = await this.prisma.client.findUnique({
      where: { id: contract.clientId },
      select: { userId: true, accountManager: true, companyName: true },
    });

    if (client?.userId) {
      this.notificationsService
        .createLocalizedNotification({
          entityId: id,
          entityType: "contract",
          eventType: "CONTRACT_SENT",
          userId: client.userId,
          messageKey: "crm.contract_review",
          messageParams: { contractTitle: contract.title },
        })
        .catch(() => undefined);
    }

    return {
      contract: updated,
      toast: { type: "success" as const, title: "Contract sent", description: "The contract link has been generated and shared." },
    };
  }
}
