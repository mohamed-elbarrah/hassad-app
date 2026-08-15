import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import {
  BusinessType,
  ClientSource,
  ClientStatus,
  ContactLogType,
  ContactLogResult,
  RequestStatus,
  UserRole,
} from "@hassad/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { CanonicalClientService } from "./canonical-client.service";
import { NotificationsService } from "../notifications/services/notifications.service";
import { SalesAssignmentService } from "./sales-assignment.service";
import {
  CreateRequestContactLogDto,
  CreateRequestDto,
} from "./dto/request.dto";
import { CreateRequestForClientDto } from "./dto/request-for-client.dto";
import type { CrmCreateRequestIntakeDto } from "../crm/dto/crm-requests.dto";

type DbClient = Prisma.TransactionClient | PrismaService;

const USER_SUMMARY_SELECT = {
  id: true,
  name: true,
  email: true,
} as const;

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
    private readonly salesAssignmentService: SalesAssignmentService,
  ) {}

  private getDbClient(tx?: Prisma.TransactionClient): DbClient {
    return tx ?? this.prisma;
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
            userId: true,
            totalProjects: true,
            activeProjects: true,
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
            totalPrice: true,
          },
        },
        contracts: {
          select: {
            id: true,
            status: true,
            totalValue: true,
          },
        },
        contactLogs: {
          take: 1,
          orderBy: { contactedAt: "desc" },
          select: {
            id: true,
            type: true,
            result: true,
            contactedAt: true,
            notes: true,
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
            businessName: true,
            businessType: true,
            accountManager: true,
            userId: true,
            totalProjects: true,
            activeProjects: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneWhatsapp: true,
              },
            },
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
          companyName: dto.companyName,
          businessName: dto.businessName,
          businessType: dto.businessType,
        });

      const assignment = await this.salesAssignmentService.findBestSales(
        [client.accountManager],
        client.id,
        tx,
      );
      const assignedSalesId = assignment?.salesId ?? null;

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
          crmStage: "NEW",
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

      await tx.client.update({
        where: { id: client.id },
        data: { intakeCompleted: true },
      });

      return tx.request.findUnique({
        where: { id: request.id },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,

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
              service: { select: { id: true, name: true, nameAr: true } },
            },
          },
        },
      });
    });

    if (!createdRequest) {
      throw new BadRequestException("Unable to create request");
    }

    if (createdRequest.assignee) {
      await this.notificationsService
        .notifyUsers({
          userIds: [createdRequest.assignee.id],
          title: "New request",
          message: `A new request was received from ${createdRequest.contactName} - ${createdRequest.companyName}`,
          entityId: createdRequest.id,
          entityType: "request",
          eventType: "REQUEST_SUBMITTED",
        })
        .catch(() => undefined);
    }

    return createdRequest;
  }

  async createForClient(dto: CreateRequestForClientDto, userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      include: { manager: true },
    });
    if (!client) {
      throw new NotFoundException("Client not found");
    }
    if (client.status === "STOPPED") {
      throw new BadRequestException(
        "Cannot create request for a stopped client",
      );
    }

    let salesId = client.accountManager;
    if (!salesId) {
      const assignment = await this.salesAssignmentService.findBestSales(
        [],
        dto.clientId,
      );
      salesId = assignment?.salesId ?? null;
    }

    const request = await this.prisma.$transaction(async (tx) => {
      const req = await tx.request.create({
        data: {
          clientId: dto.clientId,
          submittedBy: userId,
          assignedSalesId: salesId ?? undefined,
          source: "DIRECT",
          status: RequestStatus.SUBMITTED,
          notes: dto.notes ?? undefined,
          companyName: "",
          contactName: "",
          phoneWhatsapp: "",
          businessName: "",
          businessType: "OTHER",
        },
      });

      if (dto.services?.length) {
        await tx.requestService.createMany({
          data: dto.services.map((s) => ({
            requestId: req.id,
            serviceId: s.serviceId,
            quantity: s.quantity ?? 1,
            notes: s.notes,
          })),
        });
      }

      await tx.requestStatusHistory.create({
        data: {
          requestId: req.id,
          fromStatus: null,
          toStatus: RequestStatus.SUBMITTED,
          changedBy: userId,
          note: "Request created for existing client",
        },
      });

      await tx.clientHistoryLog.create({
        data: {
          clientId: dto.clientId,
          userId,
          eventType: "CLIENT_REQUEST_CREATED",
          description: "New request created for existing client",
          metadata: { requestId: req.id },
        },
      });

      return tx.request.findUnique({
        where: { id: req.id },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,

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
              service: { select: { id: true, name: true, nameAr: true } },
            },
          },
        },
      });
    });

    if (!request) {
      throw new BadRequestException("Unable to create request");
    }

    if (request.assignee) {
      await this.notificationsService
        .notifyUsers({
          userIds: [request.assignee.id],
          title: "New request",
          message: `A new request was received from ${request.contactName} - ${request.companyName}`,
          entityId: request.id,
          entityType: "request",
          eventType: "REQUEST_SUBMITTED",
        })
        .catch(() => undefined);
    }

    return request;
  }

  async createCrmIntake(userId: string, dto: CrmCreateRequestIntakeDto) {
    if (!dto.services.length) {
      throw new BadRequestException("At least one service is required");
    }

    if (dto.mode === "existing" && !dto.existingClient?.clientId) {
      throw new BadRequestException("Existing client is required");
    }

    if (dto.mode === "new" && !dto.newClient) {
      throw new BadRequestException("New client data is required");
    }

    return this.prisma.$transaction(async (tx) => {
      let clientId = "";
      let clientCreated = false;
      let requestClientLabel = "";
      let source = dto.source ?? ClientSource.PLATFORM;
      const submittedBy = userId;
      let assignedSalesId: string | null = null;
      let companyName = "";
      let contactName = "";
      let phoneWhatsapp = "";
      let email: string | null = null;
      let businessName = "";
      let businessType: BusinessType = BusinessType.OTHER;

      if (dto.mode === "existing" && dto.existingClient?.clientId) {
        const client = await tx.client.findUnique({
          where: { id: dto.existingClient.clientId },
          include: { manager: true, user: true },
        });

        if (!client) {
          throw new NotFoundException("Client not found");
        }
        if (client.status === ClientStatus.STOPPED) {
          throw new BadRequestException("Cannot create request for a stopped client");
        }

        clientId = client.id;
        requestClientLabel = client.companyName;
        companyName = client.companyName;
        contactName = client.user?.name ?? client.companyName;
        phoneWhatsapp = client.user?.phoneWhatsapp ?? "";
        email = client.user?.email ?? null;
        businessName = client.businessName;
        businessType = client.businessType as BusinessType;
        assignedSalesId = client.accountManager ?? null;
        source = dto.source ?? ClientSource.PLATFORM;
      } else if (dto.mode === "new" && dto.newClient) {
        const newClient = dto.newClient;
        const existingUser = await tx.user.findUnique({
          where: { email: newClient.email.trim().toLowerCase() },
        });

        if (existingUser) {
          throw new ConflictException("A user with this email already exists");
        }

        const role = await tx.role.findFirst({ where: { name: "CLIENT" } });
        if (!role) {
          throw new BadRequestException("CLIENT role not found");
        }

        const passwordHash = await bcrypt.hash(newClient.password, 12);
        const user = await tx.user.create({
          data: {
            name: newClient.contactName,
            email: newClient.email.trim().toLowerCase(),
            phoneWhatsapp: newClient.phoneWhatsapp,
            passwordHash,
            roleId: role.id,
          },
        });

        const resolvedClient = await this.canonicalClientService.upsertCanonicalClient(tx, {
          userId: user.id,
          companyName: newClient.companyName,
          businessName: newClient.businessName,
          businessType: newClient.businessType,
          preferredManagerId: newClient.accountManager ?? null,
          status: ClientStatus.LEAD,
        });

        clientId = resolvedClient.client.id;
        clientCreated = resolvedClient.created;
        requestClientLabel = resolvedClient.client.companyName;
        companyName = newClient.companyName;
        contactName = newClient.contactName;
        phoneWhatsapp = newClient.phoneWhatsapp;
        email = newClient.email.trim().toLowerCase();
        businessName = newClient.businessName;
        businessType = newClient.businessType as BusinessType;
        assignedSalesId = resolvedClient.client.accountManager ?? null;
        source = dto.source ?? ClientSource.PLATFORM;
      } else {
        throw new BadRequestException("Existing client or new client payload is required");
      }

      const finalSalesId = assignedSalesId
        ? assignedSalesId
        : (await this.salesAssignmentService.findBestSales([], clientId, tx))?.salesId ?? null;

      const request = await tx.request.create({
        data: {
          clientId,
          submittedBy,
          assignedSalesId: finalSalesId ?? undefined,
          companyName,
          contactName,
          phoneWhatsapp,
          email: email ?? undefined,
          businessName,
          businessType,
          source,
          notes: dto.notes ?? undefined,
          status: RequestStatus.SUBMITTED,
          crmStage: "NEW",
        },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId: request.id,
          fromStatus: null,
          toStatus: RequestStatus.SUBMITTED,
          changedBy: userId,
          note: clientCreated ? "Request created with a newly created CRM client" : "Request created for existing CRM client",
        },
      });

      await tx.requestService.createMany({
        data: dto.services.map((service) => ({
          requestId: request.id,
          serviceId: service.serviceId,
          quantity: service.quantity ?? 1,
          notes: service.notes,
        })),
      });

      await tx.clientHistoryLog.create({
        data: {
          clientId,
          userId,
          eventType: clientCreated ? "CLIENT_CREATED" : "CLIENT_REQUEST_CREATED",
          description: clientCreated
            ? "Client created from CRM intake"
            : "Request created for existing CRM client",
          metadata: { requestId: request.id },
        },
      });

      const createdRequest = await tx.request.findUnique({
        where: { id: request.id },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
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
              service: { select: { id: true, name: true, nameAr: true } },
            },
          },
        },
      });

      if (!createdRequest) {
        throw new BadRequestException("Unable to create CRM intake request");
      }

      return {
        request: createdRequest,
        client: { id: clientId, created: clientCreated, companyName: requestClientLabel },
        toast: {
          type: "success" as const,
          title: clientCreated ? "Client and request created" : "Request created",
          description: clientCreated
            ? "The client credentials were created and the intake request was submitted."
            : "The intake request was submitted for the selected client.",
        },
      };
    });
  }

  async resolveRequestContext(
    params: {
      requestId?: string | null;
      proposalId?: string | null;
    },
    _changedBy?: string | null,
    tx?: Prisma.TransactionClient,
  ) {
    const db = this.getDbClient(tx);
    const requestId = params.requestId ?? (params.proposalId
      ? (await db.proposal.findUnique({
          where: { id: params.proposalId },
          select: { requestId: true },
        }))?.requestId
      : null);

    if (!requestId) {
      throw new BadRequestException("A request reference is required");
    }

    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        client: { select: { id: true, companyName: true, userId: true } },
      },
    });
    if (!request) throw new NotFoundException("Request not found");
    return request;
  }

  async addContactLog(
    requestId: string,
    userId: string,
    dto: CreateRequestContactLogDto,
  ) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    const log = await this.prisma.requestContactLog.create({
      data: {
        requestId,
        userId,
        type: dto.type as ContactLogType,
        result: dto.result as ContactLogResult,
        notes: dto.notes,
        contactedAt: new Date(),
      },
      include: { user: { select: USER_SUMMARY_SELECT } },
    });

    await this.prisma.request.update({
      where: { id: requestId },
      data: {
        contactAttemptCount: { increment: 1 },
        lastContactAt: new Date(),
      },
    });

    return log;
  }

  async getContactLogs(requestId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    return this.prisma.requestContactLog.findMany({
      where: { requestId },
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { contactedAt: "desc" },
    });
  }
}
