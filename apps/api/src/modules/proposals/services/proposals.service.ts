import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateProposalDto, UpdateProposalDto } from "../dto/proposal.dto";
import { ProposalStatus, RequestStatus } from "@hassad/shared";
import { randomBytes } from "crypto";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { RequestsService } from "../../requests/requests.service";
import {
  buildRequestAccessWhere,
  type RequestAccessScope,
} from "../../requests/request-access";

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private requestsService: RequestsService,
  ) {}

  /** Create a proposal and publish it through the legacy workflow. */
  async create(
    userId: string,
    dto: CreateProposalDto,
    accessScope?: RequestAccessScope,
  ) {
    const token = randomBytes(32).toString("hex");

    const created = await this.prisma.$transaction(async (tx) => {
      const request = await this.requestsService.resolveRequestContext(
        { requestId: dto.requestId },
        userId,
        tx,
        accessScope,
      );
      const proposal = await tx.proposal.create({
        data: {
          requestId: request.id,
          clientId: request.clientId,
          createdBy: userId,
          title: dto.title,
          serviceDescription: dto.serviceDescription ?? "",
          servicesList: (dto.servicesList ??
            []) as unknown as Prisma.InputJsonValue,
          totalPrice: dto.totalPrice ?? 0,
          durationDays: dto.durationDays ?? 0,
          durationUnit: dto.durationUnit ?? "DAYS",
          filePath: dto.filePath ?? null,
          status: ProposalStatus.SENT,
          shareLinkToken: token,
          sentAt: new Date(),
        },
      });

      await this.requestsService.updateStatus(
        request.id,
        RequestStatus.PROPOSAL_SENT,
        userId,
        undefined,
        tx,
        accessScope,
      );

      return { proposal, request };
    });

    const recipientId =
      created.request.client.userId ?? created.request.submittedBy;
    if (recipientId) {
      this.notificationsService
        .createNotification({
          entityId: token,
          entityType: "proposal",
          eventType: "PROPOSAL_SENT",
          userId: recipientId,
          title: "عرض فني جديد بانتظار مراجعتك",
          body: `تم إرسال عرض فني جديد لك: "${created.proposal.title}". يمكنك الاطلاع عليه والرد من خلال الرابط المرسل.`,
        })
        .catch(() => undefined);
    }

    return created.proposal;
  }

  async findAll(
    filters: {
      status?: string;
      requestId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    accessScope?: RequestAccessScope,
  ) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: Prisma.ProposalWhereInput = {
      ...(accessScope?.assignedSalesId
        ? { request: buildRequestAccessWhere(accessScope) }
        : {}),
    };
    if (filters.status) where.status = filters.status as ProposalStatus;
    if (filters.requestId) where.requestId = filters.requestId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        {
          serviceDescription: { contains: filters.search, mode: "insensitive" },
        },
        {
          request: {
            companyName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          request: {
            contactName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          request: {
            businessName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          client: {
            companyName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          client: {
            businessName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          creator: { name: { contains: filters.search, mode: "insensitive" } },
        },
        { id: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        include: {
          client: {
            select: { id: true, companyName: true },
          },
          request: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              businessName: true,
              clientId: true,
            },
          },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.proposal.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findSalesAll(
    filters: {
      status?: string;
      requestId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    accessScope?: RequestAccessScope,
  ) {
    const result = await this.findAll(filters, accessScope);

    return {
      ...result,
      items: result.items.map(
        ({ shareLinkToken: _shareLinkToken, ...item }) => item,
      ),
    };
  }

  async findSalesDetail(id: string, accessScope?: RequestAccessScope) {
    const proposal = await this.prisma.proposal.findFirst({
      where: {
        id,
        ...(accessScope?.assignedSalesId
          ? { request: buildRequestAccessWhere(accessScope) }
          : {}),
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        client: {
          select: {
            id: true,
            companyName: true,
            businessName: true,
            businessType: true,
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
        contract: { select: { id: true, title: true, status: true } },
        request: {
          select: {
            id: true,
            clientId: true,
            assignedSalesId: true,
            companyName: true,
            contactName: true,
            phoneWhatsapp: true,
            email: true,
            businessName: true,
            businessType: true,
            source: true,
            notes: true,
            status: true,
            contactAttemptCount: true,
            lastContactAt: true,
            createdAt: true,
            updatedAt: true,
            client: {
              select: {
                id: true,
                companyName: true,
                businessName: true,
                businessType: true,
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
            assignee: { select: { id: true, name: true, email: true } },
            contactLogs: {
              orderBy: { contactedAt: "desc" },
              take: 20,
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            statusHistory: {
              orderBy: { changedAt: "desc" },
              take: 50,
              include: {
                changer: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException({
        code: "PROPOSAL_NOT_FOUND",
        details: { id },
      });
    }

    return {
      id: proposal.id,
      requestId: proposal.requestId,
      createdBy: proposal.createdBy,
      title: proposal.title,
      serviceDescription: proposal.serviceDescription,
      servicesList: proposal.servicesList,
      totalPrice: proposal.totalPrice,
      durationDays: proposal.durationDays,
      durationUnit: proposal.durationUnit,
      filePath: proposal.filePath,
      status: proposal.status,
      sentAt: proposal.sentAt,
      approvedAt: proposal.approvedAt,
      createdAt: proposal.createdAt,
      creator: proposal.creator,
      client: proposal.client,
      contract: proposal.contract,
      request: proposal.request,
    };
  }

  async findOne(id: string, accessScope?: RequestAccessScope) {
    const proposal = await this.prisma.proposal.findFirst({
      where: {
        id,
        ...(accessScope?.assignedSalesId
          ? { request: buildRequestAccessWhere(accessScope) }
          : {}),
      },
      include: {
        request: true,
        creator: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException({
        code: "PROPOSAL_NOT_FOUND",
        details: { id },
      });
    }

    return proposal;
  }

  async update(
    id: string,
    dto: UpdateProposalDto,
    userId: string,
    accessScope?: RequestAccessScope,
  ) {
    const proposal = await this.findOne(id, accessScope);

    // Owner guard: only creator or ADMIN can update
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: { select: { name: true } } },
    });

    const isAdmin = user?.role?.name === "ADMIN";
    const isOwner = proposal.createdBy === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException({
        code: "PERMISSION_DENIED",
        details: { resource: "PROPOSAL", id },
      });
    }

    const { servicesList, ...scalarData } = dto;
    const updateData: Prisma.ProposalUpdateInput = {
      ...scalarData,
      ...(servicesList !== undefined
        ? { servicesList: servicesList as unknown as Prisma.InputJsonValue }
        : {}),
    };

    return this.prisma.proposal.update({
      where: { id },
      data: updateData,
    });
  }

  async send(id: string) {
    await this.findOne(id);
    const token = randomBytes(32).toString("hex");

    return this.prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.SENT,
        shareLinkToken: token,
        sentAt: new Date(),
      },
    });
  }

  async approve(id: string, userId: string) {
    const proposal = await this.findOne(id);

    const updatedProposal = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.update({
        where: { id },
        data: {
          status: ProposalStatus.APPROVED,
          approvedAt: new Date(),
        },
      });

      if (proposal.requestId) {
        await this.requestsService.updateStatus(
          proposal.requestId,
          RequestStatus.CONTRACT_PREPARATION,
          userId,
          undefined,
          tx,
        );
      }

      return updated;
    });

    await this.notificationsService.createNotification({
      entityId: proposal.id,
      entityType: "proposal",
      eventType: "PROPOSAL_APPROVED",
      userId: proposal.createdBy,
      title: "تمت الموافقة على العرض الفني",
      body: `تمت الموافقة على العرض الفني "${proposal.title}"`,
    });

    return updatedProposal;
  }

  async reject(id: string) {
    const proposal = await this.findOne(id);

    const updated = await this.prisma.proposal.update({
      where: { id },
      data: { status: ProposalStatus.REJECTED },
    });

    await this.notificationsService.createNotification({
      entityId: proposal.id,
      entityType: "proposal",
      eventType: "PROPOSAL_REJECTED",
      userId: proposal.createdBy,
      title: "تم رفض العرض الفني",
      body: `تم رفض العرض الفني "${proposal.title}"`,
    });

    return updated;
  }

  async findByToken(token: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { shareLinkToken: token },
      include: {
        request: {
          select: {
            id: true,
            companyName: true,
            status: true,
          },
        },
        creator: { select: { id: true, name: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundException({
        code: "PROPOSAL_NOT_FOUND",
        details: {},
      });
    }

    return proposal;
  }

  async approveByToken(token: string, notes?: string) {
    const proposal = await this.findByToken(token);

    if (proposal.status !== ProposalStatus.SENT) {
      throw new BadRequestException({
        code: "INVALID_PROPOSAL_STATUS",
        details: { status: proposal.status },
      });
    }

    const updated = await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: ProposalStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    if (proposal.requestId) {
      await this.requestsService.updateStatus(
        proposal.requestId,
        RequestStatus.CONTRACT_PREPARATION,
        proposal.createdBy,
      );
    }

    // Notify SALES creator
    await this.notificationsService.createNotification({
      entityId: proposal.id,
      entityType: "proposal",
      eventType: "PROPOSAL_APPROVED_BY_CLIENT",
      userId: proposal.createdBy,
      title: "وافق العميل على العرض الفني",
      body: `وافق العميل على العرض الفني "${proposal.title}"${notes ? ` — ملاحظاته: ${notes}` : ""}`,
    });

    return {
      id: updated.id,
      status: updated.status,
      approvedAt: updated.approvedAt,
    };
  }

  async revisionByToken(token: string, notes?: string) {
    const proposal = await this.findByToken(token);

    if (proposal.status !== ProposalStatus.SENT) {
      throw new BadRequestException({
        code: "INVALID_PROPOSAL_STATUS",
        details: { status: proposal.status },
      });
    }

    const updated = await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.REVISION_REQUESTED },
    });

    if (proposal.requestId) {
      await this.requestsService.updateStatus(
        proposal.requestId,
        RequestStatus.PROPOSAL_IN_PROGRESS,
        proposal.createdBy,
      );
    }

    await this.notificationsService.createNotification({
      entityId: proposal.id,
      entityType: "proposal",
      eventType: "PROPOSAL_REVISION_REQUESTED",
      userId: proposal.createdBy,
      title: "طلب تعديل على العرض الفني",
      body: `طلب العميل تعديلاً على العرض الفني "${proposal.title}"${notes ? `: ${notes}` : ""}`,
    });

    return {
      id: updated.id,
      status: updated.status,
      revisionNotes: notes ?? null,
    };
  }

  /**
   * CLIENT portal: return all proposals visible to the authenticated client.
   */
  async getMyProposals(userId: string) {
    return this.prisma.proposal.findMany({
      where: {
        OR: [{ request: { submittedBy: userId } }, { client: { userId } }],
      },
      include: {
        request: {
          select: {
            id: true,
            companyName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
