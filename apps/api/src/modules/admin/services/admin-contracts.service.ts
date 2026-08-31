import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";
import { AdminActionLogService } from "./admin-action-log.service";
import { ProjectGroupChatService } from "../../chat/services/project-group-chat.service";
import { StorageService } from "../../../common/storage/storage.service";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "../../../common/storage/storage.constants";
import {
  ContractStatus,
  ContractType,
  ProjectStatus,
  ProjectPeriodStatus,
  TaskPriority,
} from "@hassad/shared";
import type {
  AdminContractFileResponseDto,
  AdminContractVersionResponseDto,
  AdminContractsQueryDto,
  ConvertToProjectDto,
} from "../dto/admin-contracts.dto";

@Injectable()
export class AdminContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionLog: AdminActionLogService,
    private readonly storageService: StorageService,
    private readonly projectGroupChatService: ProjectGroupChatService,
  ) {}

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
    return { canIntervene: user?.role?.name === "ADMIN" || permissions.has("admin.contracts.intervene") };
  }

  async findAll(query: AdminContractsQueryDto) {
    const where: Prisma.ContractWhereInput = {};
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
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type as ContractType;
    if (query.expiringDays) {
      const now = new Date();
      const future = new Date(
        now.getTime() + query.expiringDays * 24 * 60 * 60 * 1000,
      );
      where.endDate = { gte: now, lte: future };
      where.status = ContractStatus.ACTIVE;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total, active, signed, eSigned, value] = await Promise.all([
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
      this.prisma.contract.count({ where: { ...where, status: ContractStatus.ACTIVE } }),
      this.prisma.contract.count({ where: { ...where, status: ContractStatus.SIGNED } }),
      this.prisma.contract.count({ where: { ...where, eSigned: true } }),
      this.prisma.contract.aggregate({ where, _sum: { totalValue: true } }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        title: c.title,
        clientName: c.client?.companyName ?? "—",
        type: c.type,
        status: c.status,
        monthlyValue: Number(c.monthlyValue),
        totalValue: Number(c.totalValue),
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
      stats: {
        active,
        signed,
        eSigned,
        totalValue: Number(value._sum.totalValue ?? 0),
      },
    };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true } },
        versions: { orderBy: { versionNumber: "desc" } },
        paymentPlans: { include: { invoices: true } },
        renewalAlerts: { orderBy: { scheduledAt: "desc" } },
        statusHistory: {
          orderBy: { changedAt: "desc" },
          include: { changedByUser: { select: { id: true, name: true } } },
        },
        invoices: {
          include: { items: true, payments: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!contract) throw new NotFoundException({ code: "CONTRACT_NOT_FOUND", details: {} });

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

    const fileUrl = await this.resolveContractFileUrl(contract.filePath);
    const versions: AdminContractVersionResponseDto[] = await Promise.all(
      contract.versions.map(async (version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        fileUrl: await this.resolveContractFileUrl(version.filePath),
        createdAt: version.createdAt.toISOString(),
      })),
    );

    return {
      id: contract.id,
      clientId: contract.clientId,
      proposalId: contract.proposalId,
      requestId: contract.requestId,
      title: contract.title,
      type: contract.type,
      status: contract.status,
      startDate: contract.startDate.toISOString(),
      endDate: contract.endDate.toISOString(),
      monthlyValue: Number(contract.monthlyValue),
      totalValue: Number(contract.totalValue),
      fileUrl,
      versionNumber: contract.versionNumber,
      eSigned: contract.eSigned,
      signedAt: contract.signedAt?.toISOString() ?? null,
      createdAt: contract.createdAt.toISOString(),
      currency: contract.currency,
      downPaymentType: contract.downPaymentType,
      downPaymentValue: contract.downPaymentValue == null ? null : Number(contract.downPaymentValue),
      numberOfMonths: contract.numberOfMonths,
      servicesList: contract.servicesList,
      client: contract.client,
      project,
      invoices: contract.invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        status: invoice.status,
        dueDate: invoice.dueDate?.toISOString() ?? null,
        createdAt: invoice.createdAt.toISOString(),
        paidAt: invoice.paidAt?.toISOString() ?? null,
        payments: invoice.payments.map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount),
          status: payment.status,
          date: payment.date?.toISOString(),
          createdAt: payment.createdAt.toISOString(),
        })),
      })),
      statusHistory: contract.statusHistory.map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        changedAt: entry.changedAt.toISOString(),
        reason: entry.reason,
        changedBy: entry.changedBy,
        changer: entry.changedByUser,
      })),
      versions,
      paymentPlans: contract.paymentPlans.map((plan) => ({
        id: plan.id,
        label: plan.label,
        sequence: plan.sequence,
        triggerType: plan.triggerType,
        amountType: plan.amountType,
        amountValue: Number(plan.amountValue),
        isRecurring: plan.isRecurring,
        dueOffsetDays: plan.dueOffsetDays,
        isActive: plan.isActive,
      })),
    };
  }

  async getFileUrl(contractId: string): Promise<AdminContractFileResponseDto> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { filePath: true },
    });
    if (!contract) throw new NotFoundException({ code: "CONTRACT_NOT_FOUND", details: {} });

    return {
      fileUrl: await this.resolveContractFileUrl(contract.filePath),
    };
  }

  private resolveContractFileUrl(filePath: string | null): Promise<string | null> {
    return this.storageService.getPresignedUrlIfExists(
      filePath,
      PRESIGNED_URL_EXPIRY_SECONDS.ADMIN_CONTRACT_DOWNLOAD,
    );
  }

  async cancel(contractId: string, reason: string | undefined, adminId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException({ code: "CONTRACT_NOT_FOUND", details: {} });

    const before = { status: contract.status };
    const after = { status: "CANCELLED", reason };

    await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id: contractId },
        data: { status: "CANCELLED" as any },
      }),
      this.prisma.contractStatusHistory.create({
        data: {
          contractId,
          fromStatus: contract.status as any,
          toStatus: "CANCELLED" as any,
          changedBy: adminId,
          reason,
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.contracts.cancel",
          entity: "contract",
          entityId: contractId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "contract",
      targetId: contractId,
      actionType: "admin.contracts.cancel",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { code: "CONTRACT_CANCELLED" };
  }

  async triggerRenewalAlert(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException({ code: "CONTRACT_NOT_FOUND", details: {} });

    const pendingAlert = await this.prisma.contractRenewalAlert.findFirst({
      where: { contractId, isSent: false },
      select: { id: true },
    });
    if (pendingAlert) return { code: "CONTRACT_RENEWAL_ALERT_ALREADY_PENDING" };

    await this.prisma.contractRenewalAlert.create({
      data: {
        contractId,
        alertType: "THIRTY_DAYS",
        isSent: false,
        scheduledAt: new Date(),
      },
    });
    await this.actionLog.record({
      actorId: userId,
      targetType: "contract",
      targetId: contractId,
      actionType: "admin.contracts.renewal_alert_triggered",
      beforeState: { renewalAlertPending: false },
      afterState: { renewalAlertPending: true },
    });
    return { code: "CONTRACT_RENEWAL_ALERT_TRIGGERED" };
  }

  async updateStatus(
    contractId: string,
    userId: string,
    status: ContractStatus,
    reason?: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException({ code: "CONTRACT_NOT_FOUND", details: {} });

    const before = { status: contract.status };
    const after = { status, reason };

    await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id: contractId },
        data: { status: status as any },
      }),
      this.prisma.contractStatusHistory.create({
        data: {
          contractId,
          fromStatus: contract.status as any,
          toStatus: status as any,
          changedBy: userId,
          reason,
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.contracts.status_change",
          entity: "contract",
          entityId: contractId,
          userId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: userId,
      targetType: "contract",
      targetId: contractId,
      actionType: "admin.contracts.status_change",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { code: "CONTRACT_STATUS_UPDATED" };
  }

  async convertToProject(id: string, userId: string, dto: ConvertToProjectDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true, userId: true } },
      },
    });
    if (!contract) throw new NotFoundException({ code: "CONTRACT_NOT_FOUND", details: {} });
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException({ code: "CONTRACT_MUST_BE_ACTIVE", details: {} });
    }

    const existingProject = await this.prisma.project.findFirst({
      where: { contractId: id },
      select: { id: true },
    });
    if (existingProject) {
      throw new BadRequestException({ code: "CONTRACT_ALREADY_CONVERTED", details: {} });
    }

    const projectName =
      dto.name || `${contract.client.companyName} — ${contract.title}`;
    const pmId = dto.pmId || null;
    if (pmId) {
      const pm = await this.prisma.user.findFirst({
        where: { id: pmId, isActive: true, role: { name: "PM" } },
        select: { id: true },
      });
      if (!pm) throw new NotFoundException({ code: "PROJECT_MANAGER_NOT_ELIGIBLE", details: {} });
    }

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          clientId: contract.clientId,
          contractId: contract.id,
          projectManagerId: pmId,
          name: projectName,
          status: ProjectStatus.PLANNING,
          priority: TaskPriority.NORMAL,
          startDate: contract.startDate,
          endDate: contract.endDate,
        },
      });

      await tx.projectPeriod.create({
        data: {
          projectId: created.id,
          periodNumber: 1,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: ProjectPeriodStatus.UPCOMING,
        },
      });

      await tx.ledger.create({
        data: {
          action: "admin.contracts.convert_to_project",
          entity: "contract",
          entityId: id,
          userId,
          after: { projectId: created.id, projectName },
        },
      });

      if (contract.client.userId) {
        await tx.clientHistoryLog.create({
          data: {
            clientId: contract.clientId,
            userId,
            eventType: "CONTRACT_CONVERTED_TO_PROJECT",
            description: "CONTRACT_CONVERTED_TO_PROJECT",
            metadata: { contractId: id, projectId: created.id, projectName },
          },
        });
      }

      return created;
    });

    await this.actionLog.record({
      actorId: userId,
      targetType: "contract",
      targetId: id,
      actionType: "admin.contracts.convert-to-project",
      afterState: { projectId: project.id, projectName },
    });
    this.projectGroupChatService
      .ensure(project.id)
      .catch(() => undefined);

    return {
      code: "CONTRACT_CONVERTED_TO_PROJECT",
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        clientId: project.clientId,
        contractId: project.contractId,
        projectManagerId: project.projectManagerId,
        startDate: project.startDate.toISOString(),
        endDate: project.endDate.toISOString(),
      },
    };
  }
}
