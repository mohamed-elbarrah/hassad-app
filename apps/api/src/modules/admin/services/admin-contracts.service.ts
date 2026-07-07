import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ContractStatus, ProjectStatus, ProjectPeriodStatus, TaskPriority } from "@hassad/shared";
import { ConvertToProjectDto } from "../dto/admin-contracts.dto";

@Injectable()
export class AdminContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
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
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.expiringDays) {
      const now = new Date();
      const future = new Date(
        now.getTime() + parseInt(query.expiringDays, 10) * 24 * 60 * 60 * 1000,
      );
      where.endDate = { gte: now, lte: future };
      where.status = "ACTIVE";
    }

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { companyName: true } },
          renewalAlerts: { where: { isSent: false }, select: { id: true } },
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
        versionNumber: c.versionNumber,
        eSigned: c.eSigned,
        pendingRenewalAlerts: c.renewalAlerts.length,
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
        client: { select: { id: true, companyName: true } },
        versions: { orderBy: { versionNumber: "desc" } },
        paymentPlans: { include: { invoices: true } },
        renewalAlerts: { orderBy: { scheduledAt: "desc" } },
        statusHistory: { orderBy: { changedAt: "desc" } },
      },
    });
    if (!contract) throw new NotFoundException("Contract not found");
    return contract;
  }

  async cancel(contractId: string, reason: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException("Contract not found");

    await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id: contractId },
        data: { status: "CANCELLED" as any },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.contracts.cancel",
          entity: "contract",
          entityId: contractId,
          after: { previousStatus: contract.status, reason },
        },
      }),
    ]);
    return { success: true };
  }

  async triggerRenewalAlert(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException("Contract not found");

    await this.prisma.contractRenewalAlert.create({
      data: {
        contractId,
        alertType: "THIRTY_DAYS",
        isSent: false,
        scheduledAt: new Date(),
      },
    });
    return { success: true };
  }

  async convertToProject(id: string, userId: string, dto: ConvertToProjectDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true, userId: true } },
      },
    });
    if (!contract) throw new NotFoundException("Contract not found");
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException("يمكن تحويل العقود النشطة فقط إلى مشاريع");
    }

    const existingProject = await this.prisma.project.findFirst({
      where: { contractId: id },
      select: { id: true },
    });
    if (existingProject) {
      throw new BadRequestException("تم تحويل هذا العقد إلى مشروع مسبقاً");
    }

    const projectName = dto.name || `${contract.client.companyName} — ${contract.title}`;
    const pmId = dto.pmId || null;

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
            description: `تم تحويل العقد "${contract.title}" إلى مشروع "${projectName}"`,
            metadata: { contractId: id, projectId: created.id },
          },
        });
      }

      return created;
    });

    return project;
  }
}
