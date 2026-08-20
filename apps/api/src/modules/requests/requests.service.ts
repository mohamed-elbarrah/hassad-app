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
import type { RequestQueryDto } from "./dto/request-query.dto";
import type { CrmCreateRequestIntakeDto } from "../crm/dto/crm-requests.dto";
import {
  getAllowedRequestTransitions,
  getCrmStageForRequestStatus,
  getStatusesForPipelineGroup,
  REQUEST_PIPELINE_STAGES,
  type RequestPipelineGroup,
} from "./request-workflow";

type DbClient = Prisma.TransactionClient | PrismaService;
type RequestListFilters = RequestQueryDto & {
  statusGroup?: RequestPipelineGroup;
  excludeCancelled?: boolean;
  view?: "board" | "table";
};

const USER_SUMMARY_SELECT = {
  id: true,
  name: true,
  email: true,
} as const;

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
    const allowedTransitions = getAllowedRequestTransitions(fromStatus);

    if (!allowedTransitions.includes(toStatus)) {
      throw new BadRequestException({
        code: "INVALID_REQUEST_STATUS_TRANSITION",
        details: { fromStatus, toStatus },
      });
    }
  }

  private buildRequestWhere(
    filters?: RequestListFilters,
  ): Prisma.RequestWhereInput {
    const where: Prisma.RequestWhereInput = {};

    if (filters?.statusGroup) {
      where.status = {
        in: [...getStatusesForPipelineGroup(filters.statusGroup)],
      };
    } else if (filters?.status) {
      where.status = filters.status;
    } else if (filters?.excludeCancelled) {
      where.status = { not: RequestStatus.CANCELLED };
    }

    if (filters?.assignedSalesId) {
      where.assignedSalesId = filters.assignedSalesId;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    const search = filters?.search?.trim();
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneWhatsapp: { contains: search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  async findAll(filters?: RequestListFilters) {
    const where = this.buildRequestWhere(filters);
    const limit = filters?.limit ?? 100;
    const page = filters?.page ?? 1;

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
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
        contracts: {
          orderBy: { createdAt: "desc" },
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
      take: limit,
      skip: limit ? (page - 1) * limit : undefined,
    });
  }

  async canUserUpdateStatus(user: {
    id: string;
    role?: string;
    permissions?: string[];
  }) {
    if (
      user.role === "ADMIN" ||
      user.permissions?.includes("requests.update")
    ) {
      return true;
    }

    const record = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: {
          select: {
            name: true,
            permissions: { select: { permission: { select: { name: true } } } },
          },
        },
        permissions: { select: { permission: { select: { name: true } } } },
      },
    });

    if (!record) return false;

    return (
      record.role.name === "ADMIN" ||
      record.role.permissions.some(
        ({ permission }) => permission.name === "requests.update",
      ) ||
      record.permissions.some(
        ({ permission }) => permission.name === "requests.update",
      )
    );
  }

  async findSalesPipeline(
    filters?: RequestListFilters,
    canUpdateStatus = false,
  ) {
    const boardView = filters?.view === "board";
    const page = filters?.page ?? 1;
    const limit = boardView ? 500 : (filters?.limit ?? 50);
    const excludeCancelled = !filters?.statusGroup && !filters?.status;
    const where = this.buildRequestWhere({ ...filters, excludeCancelled });
    const summaryWhere = this.buildRequestWhere({
      ...filters,
      excludeCancelled: !filters?.statusGroup && !filters?.status,
    });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [items, total, openDeals, proposalFlow, contractFlow, wonThisMonth] =
      await Promise.all([
        this.findAll({
          ...filters,
          page,
          limit,
          excludeCancelled,
        }),
        this.prisma.request.count({ where }),
        this.prisma.request.count({
          where: {
            AND: [
              summaryWhere,
              {
                status: {
                  notIn: [
                    RequestStatus.CANCELLED,
                    RequestStatus.PROJECT_CREATED,
                  ],
                },
              },
            ],
          },
        }),
        this.prisma.request.count({
          where: {
            AND: [
              summaryWhere,
              {
                status: {
                  in: [
                    RequestStatus.PROPOSAL_IN_PROGRESS,
                    RequestStatus.PROPOSAL_SENT,
                    RequestStatus.NEGOTIATION,
                  ],
                },
              },
            ],
          },
        }),
        this.prisma.request.count({
          where: {
            AND: [
              summaryWhere,
              {
                status: {
                  in: [
                    RequestStatus.CONTRACT_PREPARATION,
                    RequestStatus.CONTRACT_SENT,
                  ],
                },
              },
            ],
          },
        }),
        this.prisma.request.count({
          where: {
            AND: [
              summaryWhere,
              {
                status: {
                  in: [RequestStatus.SIGNED, RequestStatus.PROJECT_CREATED],
                },
                updatedAt: { gte: monthStart },
              },
            ],
          },
        }),
      ]);

    return {
      __standardResponse: true as const,
      data: {
        items: items.map((item) => ({
          ...item,
          allowedNextStatuses: getAllowedRequestTransitions(
            item.status as RequestStatus,
          ),
          capabilities: {
            canUpdateStatus,
            canLogContact: canUpdateStatus,
          },
        })),
        stages: REQUEST_PIPELINE_STAGES,
        summary: { openDeals, proposalFlow, contractFlow, wonThisMonth },
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    id: string,
    capabilities?: { canLogContact: boolean; canUpdateStatus: boolean },
  ) {
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
        contactLogs: {
          take: 100,
          orderBy: { contactedAt: "desc" },
          include: { user: { select: USER_SUMMARY_SELECT } },
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
      throw new NotFoundException({
        code: "REQUEST_NOT_FOUND",
        details: { id },
      });
    }

    return capabilities
      ? {
          ...request,
          capabilities: {
            ...capabilities,
            allowedNextStatuses: getAllowedRequestTransitions(
              request.status as RequestStatus,
            ),
          },
        }
      : request;
  }

  async updateStatus(
    requestId: string,
    toStatus: RequestStatus,
    changedBy?: string | null,
    note?: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (!tx) {
      return this.prisma.$transaction((transaction) =>
        this.updateStatus(requestId, toStatus, changedBy, note, transaction),
      );
    }

    const db = this.getDbClient(tx);
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });

    if (!request) {
      throw new NotFoundException({
        code: "REQUEST_NOT_FOUND",
        details: { id: requestId },
      });
    }

    if (request.status === toStatus) {
      return request;
    }

    this.assertValidTransition(request.status as RequestStatus, toStatus);

    const updateResult = await db.request.updateMany({
      where: { id: requestId, status: request.status },
      data: {
        status: toStatus,
        crmStage: getCrmStageForRequestStatus(toStatus),
      },
    });

    if (updateResult.count !== 1) {
      throw new ConflictException({
        code: "REQUEST_STATUS_CHANGED",
        details: { id: requestId },
      });
    }

    const updatedRequest = await db.request.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, crmStage: true },
    });

    if (!updatedRequest) {
      throw new NotFoundException({
        code: "REQUEST_NOT_FOUND",
        details: { id: requestId },
      });
    }

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
    tx?: Prisma.TransactionClient,
  ) {
    return this.updateStatus(requestId, toStatus, changedBy, note, tx);
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
      throw new BadRequestException({
        code: "REQUEST_CREATION_FAILED",
        details: {},
      });
    }

    if (createdRequest.assignee) {
      await this.notificationsService
        .notifyUsers({
          userIds: [createdRequest.assignee.id],
          title: "REQUEST_SUBMITTED",
          message: "REQUEST_SUBMITTED",
          entityId: createdRequest.id,
          entityType: "request",
          eventType: "REQUEST_SUBMITTED",
          metadata: {
            contactName: createdRequest.contactName,
            companyName: createdRequest.companyName,
          },
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
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        details: { id: dto.clientId },
      });
    }
    if (client.status === "STOPPED") {
      throw new BadRequestException({
        code: "STOPPED_CLIENT_REQUEST_FORBIDDEN",
        details: { clientId: dto.clientId },
      });
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
          note: "REQUEST_CREATED_FOR_EXISTING_CLIENT",
        },
      });

      await tx.clientHistoryLog.create({
        data: {
          clientId: dto.clientId,
          userId,
          eventType: "CLIENT_REQUEST_CREATED",
          description: "CLIENT_REQUEST_CREATED",
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
      throw new BadRequestException({
        code: "REQUEST_CREATION_FAILED",
        details: {},
      });
    }

    if (request.assignee) {
      await this.notificationsService
        .notifyUsers({
          userIds: [request.assignee.id],
          title: "REQUEST_SUBMITTED",
          message: "REQUEST_SUBMITTED",
          entityId: request.id,
          entityType: "request",
          eventType: "REQUEST_SUBMITTED",
          metadata: {
            contactName: request.contactName,
            companyName: request.companyName,
          },
        })
        .catch(() => undefined);
    }

    return request;
  }

  async createCrmIntake(userId: string, dto: CrmCreateRequestIntakeDto) {
    if (!dto.services.length) {
      throw new BadRequestException({
        code: "REQUEST_SERVICE_REQUIRED",
        details: { field: "services" },
      });
    }

    if (dto.mode === "existing" && !dto.existingClient?.clientId) {
      throw new BadRequestException({
        code: "EXISTING_CLIENT_REQUIRED",
        details: { field: "existingClient.clientId" },
      });
    }

    if (dto.mode === "new" && !dto.newClient) {
      throw new BadRequestException({
        code: "NEW_CLIENT_REQUIRED",
        details: { field: "newClient" },
      });
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
          throw new NotFoundException({
            code: "CLIENT_NOT_FOUND",
            details: { id: dto.existingClient.clientId },
          });
        }
        if (client.status === ClientStatus.STOPPED) {
          throw new BadRequestException({
            code: "STOPPED_CLIENT_REQUEST_FORBIDDEN",
            details: { clientId: client.id },
          });
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
          throw new ConflictException({
            code: "USER_EMAIL_ALREADY_EXISTS",
            details: { email: newClient.email.trim().toLowerCase() },
          });
        }

        const role = await tx.role.findFirst({ where: { name: "CLIENT" } });
        if (!role) {
          throw new BadRequestException({
            code: "CLIENT_ROLE_NOT_FOUND",
            details: {},
          });
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

        const resolvedClient =
          await this.canonicalClientService.upsertCanonicalClient(tx, {
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
        throw new BadRequestException({
          code: "CLIENT_PAYLOAD_REQUIRED",
          details: { mode: dto.mode },
        });
      }

      const finalSalesId = assignedSalesId
        ? assignedSalesId
        : ((await this.salesAssignmentService.findBestSales([], clientId, tx))
            ?.salesId ?? null);

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
          note: clientCreated
            ? "REQUEST_CREATED_WITH_NEW_CRM_CLIENT"
            : "REQUEST_CREATED_FOR_EXISTING_CRM_CLIENT",
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
          eventType: clientCreated
            ? "CLIENT_CREATED"
            : "CLIENT_REQUEST_CREATED",
          description: clientCreated
            ? "CLIENT_CREATED_FROM_CRM_INTAKE"
            : "REQUEST_CREATED_FOR_EXISTING_CRM_CLIENT",
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
        throw new BadRequestException({
          code: "CRM_INTAKE_REQUEST_CREATION_FAILED",
          details: {},
        });
      }

      return {
        request: createdRequest,
        client: {
          id: clientId,
          created: clientCreated,
          companyName: requestClientLabel,
        },
        result: {
          code: clientCreated
            ? "CRM_CLIENT_AND_REQUEST_CREATED"
            : "CRM_REQUEST_CREATED",
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
    const requestId =
      params.requestId ??
      (params.proposalId
        ? (
            await db.proposal.findUnique({
              where: { id: params.proposalId },
              select: { requestId: true },
            })
          )?.requestId
        : null);

    if (!requestId) {
      throw new BadRequestException({
        code: "REQUEST_REFERENCE_REQUIRED",
        details: {},
      });
    }

    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        client: { select: { id: true, companyName: true, userId: true } },
      },
    });
    if (!request) {
      throw new NotFoundException({
        code: "REQUEST_NOT_FOUND",
        details: { id: requestId },
      });
    }
    return request;
  }

  async addContactLog(
    requestId: string,
    userId: string,
    dto: CreateRequestContactLogDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.request.findUnique({
        where: { id: requestId },
        select: { id: true },
      });

      if (!request) {
        throw new NotFoundException({
          code: "REQUEST_NOT_FOUND",
          details: { id: requestId },
        });
      }

      const contactedAt = new Date();
      const log = await tx.requestContactLog.create({
        data: {
          requestId,
          userId,
          type: dto.type as ContactLogType,
          result: dto.result as ContactLogResult,
          notes: dto.notes,
          contactedAt,
        },
        include: { user: { select: USER_SUMMARY_SELECT } },
      });

      await tx.request.update({
        where: { id: requestId },
        data: {
          contactAttemptCount: { increment: 1 },
          lastContactAt: contactedAt,
        },
      });

      return log;
    });
  }

  async getContactLogs(requestId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException({
        code: "REQUEST_NOT_FOUND",
        details: { id: requestId },
      });
    }

    return this.prisma.requestContactLog.findMany({
      where: { requestId },
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { contactedAt: "desc" },
      take: 100,
    });
  }
}
