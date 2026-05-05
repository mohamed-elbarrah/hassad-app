import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PipelineStage, RequestStatus, UserRole } from "@hassad/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { CanonicalClientService } from "./canonical-client.service";
import { NotificationsService } from "../notifications/services/notifications.service";
import { CreateRequestDto } from "./dto/request.dto";

type DbClient = Prisma.TransactionClient | PrismaService;

const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.SUBMITTED]: [
    RequestStatus.QUALIFYING,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.QUALIFYING]: [
    RequestStatus.PROPOSAL_IN_PROGRESS,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.PROPOSAL_IN_PROGRESS]: [
    RequestStatus.PROPOSAL_SENT,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.PROPOSAL_SENT]: [
    RequestStatus.NEGOTIATION,
    RequestStatus.PROPOSAL_IN_PROGRESS,
    RequestStatus.CONTRACT_PREPARATION,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.NEGOTIATION]: [
    RequestStatus.PROPOSAL_IN_PROGRESS,
    RequestStatus.CONTRACT_PREPARATION,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.CONTRACT_PREPARATION]: [
    RequestStatus.CONTRACT_SENT,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.CONTRACT_SENT]: [
    RequestStatus.CONTRACT_PREPARATION,
    RequestStatus.SIGNED,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.SIGNED]: [
    RequestStatus.PROJECT_CREATED,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.PROJECT_CREATED]: [],
  [RequestStatus.CANCELLED]: [],
};

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly canonicalClientService: CanonicalClientService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getDbClient(tx?: Prisma.TransactionClient): DbClient {
    return tx ?? this.prisma;
  }

  private getStatusFromLeadStage(stage: string): RequestStatus {
    switch (stage) {
      case PipelineStage.PROPOSAL_SENT:
        return RequestStatus.PROPOSAL_SENT;
      case PipelineStage.FOLLOW_UP:
        return RequestStatus.NEGOTIATION;
      case PipelineStage.APPROVED:
        return RequestStatus.CONTRACT_PREPARATION;
      case PipelineStage.CONTRACT_SIGNED:
        return RequestStatus.SIGNED;
      case PipelineStage.MEETING_SCHEDULED:
      case PipelineStage.MEETING_DONE:
        return RequestStatus.PROPOSAL_IN_PROGRESS;
      default:
        return RequestStatus.QUALIFYING;
    }
  }

  private async resolveAssignee(
    db: DbClient,
    preferredIds: Array<string | null | undefined>,
  ) {
    const uniquePreferredIds = [
      ...new Set(preferredIds.filter(Boolean)),
    ] as string[];

    if (uniquePreferredIds.length > 0) {
      const preferredUsers = await db.user.findMany({
        where: {
          id: { in: uniquePreferredIds },
          isActive: true,
          role: { name: { in: [UserRole.SALES, UserRole.ADMIN] } },
        },
        select: { id: true },
      });

      if (preferredUsers.length > 0) {
        return preferredUsers[0].id;
      }
    }

    const salesUser = await db.user.findFirst({
      where: { isActive: true, role: { name: UserRole.SALES } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (salesUser) {
      return salesUser.id;
    }

    const adminUser = await db.user.findFirst({
      where: { isActive: true, role: { name: UserRole.ADMIN } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    return adminUser?.id ?? null;
  }

  private assertValidTransition(
    fromStatus: RequestStatus,
    toStatus: RequestStatus,
  ) {
    const allowedTransitions = REQUEST_TRANSITIONS[fromStatus] ?? [];

    if (!allowedTransitions.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid request status transition from ${fromStatus} to ${toStatus}`,
      );
    }
  }

  async findAll(filters?: {
    status?: string;
    search?: string;
    assignedSalesId?: string;
    clientId?: string;
    limit?: number;
    page?: number;
  }) {
    const where: Prisma.RequestWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as RequestStatus;
    }

    if (filters?.assignedSalesId) {
      where.assignedSalesId = filters.assignedSalesId;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.request.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            userId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                nameAr: true,
              },
            },
          },
        },
        proposals: {
          select: {
            id: true,
            status: true,
          },
        },
        contracts: {
          select: {
            id: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit ? Number(filters.limit) : undefined,
      skip:
        filters?.limit && filters?.page
          ? (Number(filters.page) - 1) * Number(filters.limit)
          : undefined,
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            phoneWhatsapp: true,
            email: true,
            businessName: true,
            businessType: true,
            accountManager: true,
            userId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                nameAr: true,
              },
            },
          },
        },
        statusHistory: {
          include: {
            changer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { changedAt: "asc" },
        },
        proposals: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        contracts: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    return request;
  }

  async updateStatus(
    requestId: string,
    toStatus: RequestStatus,
    changedBy?: string | null,
    note?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.getDbClient(tx);
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    if (request.status === toStatus) {
      return request;
    }

    this.assertValidTransition(request.status as RequestStatus, toStatus);

    const updatedRequest = await db.request.update({
      where: { id: requestId },
      data: { status: toStatus },
    });

    await db.requestStatusHistory.create({
      data: {
        requestId,
        fromStatus: request.status,
        toStatus,
        changedBy: changedBy ?? undefined,
        note,
      },
    });

    return updatedRequest;
  }

  async changeStatus(
    requestId: string,
    toStatus: RequestStatus,
    changedBy: string,
    note?: string,
  ) {
    return this.updateStatus(requestId, toStatus, changedBy, note);
  }

  async createPortalRequest(
    requester: { id: string; role?: string | null },
    dto: CreateRequestDto,
  ) {
    const clientUserId =
      requester.role === UserRole.CLIENT ? requester.id : null;

    const createdRequest = await this.prisma.$transaction(async (tx) => {
      const { client } =
        await this.canonicalClientService.upsertCanonicalClient(tx, {
          userId: clientUserId,
          email: dto.email ?? null,
          companyName: dto.companyName,
          contactName: dto.contactName,
          phoneWhatsapp: dto.phoneWhatsapp,
          businessName: dto.businessName,
          businessType: dto.businessType,
        });

      const assignedSalesId = await this.resolveAssignee(tx, [
        client.accountManager,
      ]);

      if (assignedSalesId && !client.accountManager) {
        await tx.client.update({
          where: { id: client.id },
          data: { accountManager: assignedSalesId },
        });
      }

      const request = await tx.request.create({
        data: {
          clientId: client.id,
          submittedBy: requester.id,
          assignedSalesId: assignedSalesId ?? undefined,
          companyName: dto.companyName,
          contactName: dto.contactName,
          phoneWhatsapp: dto.phoneWhatsapp,
          email: dto.email ?? undefined,
          businessName: dto.businessName,
          businessType: dto.businessType,
          source: dto.source,
          notes: dto.notes ?? undefined,
          status: RequestStatus.SUBMITTED,
        },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId: request.id,
          toStatus: RequestStatus.SUBMITTED,
          changedBy: requester.id,
        },
      });

      if (dto.services?.length) {
        await tx.requestService.createMany({
          data: dto.services.map((service) => ({
            requestId: request.id,
            serviceId: service.serviceId,
            quantity: service.quantity ?? 1,
            notes: service.notes,
          })),
        });
      }

      return tx.request.findUnique({
        where: { id: request.id },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              userId: true,
            },
          },
          services: {
            include: {
              service: { select: { id: true, name: true, nameAr: true } },
            },
          },
        },
      });
    });

    if (!createdRequest) {
      throw new BadRequestException("Unable to create request");
    }

    await this.notificationsService
      .broadcast({
        title: "طلب جديد",
        message: `تم استلام طلب جديد من ${createdRequest.contactName} - ${createdRequest.companyName}`,
        roles: [UserRole.SALES],
      })
      .catch(() => undefined);

    return createdRequest;
  }

  async ensureRequestForLead(
    leadId: string,
    changedBy?: string | null,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.getDbClient(tx);
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        services: true,
        request: {
          include: {
            client: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                userId: true,
              },
            },
            lead: { select: { id: true, pipelineStage: true } },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    if (lead.request) {
      return lead.request;
    }

    const { client } = await this.canonicalClientService.upsertCanonicalClient(
      db,
      {
        email: lead.email ?? null,
        companyName: lead.companyName,
        contactName: lead.contactName,
        phoneWhatsapp: lead.phoneWhatsapp,
        businessName: lead.businessName,
        businessType: lead.businessType,
        preferredManagerId: lead.assignedTo ?? null,
      },
    );

    const requestStatus = this.getStatusFromLeadStage(lead.pipelineStage);

    const request = await db.request.create({
      data: {
        clientId: client.id,
        submittedBy: lead.createdBy ?? undefined,
        assignedSalesId: lead.assignedTo ?? client.accountManager ?? undefined,
        companyName: lead.companyName,
        contactName: lead.contactName,
        phoneWhatsapp: lead.phoneWhatsapp,
        email: lead.email ?? undefined,
        businessName: lead.businessName,
        businessType: lead.businessType,
        source: lead.source,
        notes: lead.notes ?? undefined,
        status: requestStatus,
      },
    });

    await db.requestStatusHistory.create({
      data: {
        requestId: request.id,
        toStatus: requestStatus,
        changedBy: changedBy ?? lead.createdBy ?? lead.assignedTo ?? undefined,
        note: "Backfilled from legacy lead workflow",
      },
    });

    if (lead.services.length > 0) {
      await db.requestService.createMany({
        data: lead.services.map((service) => ({
          requestId: request.id,
          serviceId: service.serviceId,
          quantity: service.quantity,
          notes: service.notes ?? undefined,
        })),
      });
    }

    await db.lead.update({
      where: { id: lead.id },
      data: { requestId: request.id },
    });

    return db.request.findUnique({
      where: { id: request.id },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            userId: true,
          },
        },
        lead: { select: { id: true, pipelineStage: true } },
      },
    });
  }

  async resolveRequestContext(
    params: {
      requestId?: string | null;
      leadId?: string | null;
      proposalId?: string | null;
    },
    changedBy?: string | null,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.getDbClient(tx);

    if (params.requestId) {
      const request = await db.request.findUnique({
        where: { id: params.requestId },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              userId: true,
            },
          },
          lead: { select: { id: true, pipelineStage: true } },
        },
      });

      if (!request) {
        throw new NotFoundException("Request not found");
      }

      return request;
    }

    if (params.proposalId) {
      const proposal = await db.proposal.findUnique({
        where: { id: params.proposalId },
        select: { requestId: true, leadId: true },
      });

      if (!proposal) {
        throw new NotFoundException("Proposal not found");
      }

      if (proposal.requestId) {
        return this.resolveRequestContext(
          { requestId: proposal.requestId },
          changedBy,
          tx,
        );
      }

      if (proposal.leadId) {
        return this.ensureRequestForLead(proposal.leadId, changedBy, tx);
      }
    }

    if (params.leadId) {
      return this.ensureRequestForLead(params.leadId, changedBy, tx);
    }

    throw new BadRequestException("A request reference is required");
  }
}
