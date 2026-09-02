import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma, ProposalStatus as PrismaProposalStatus } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateProposalDto, UpdateProposalDto } from "../dto/proposal.dto";
import { ProposalStatus, RequestStatus } from "@hassad/shared";
import { randomBytes } from "crypto";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { RequestsService } from "../../requests/requests.service";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
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
    private storageService: StorageService,
  ) {}

  /** Create a proposal and publish it through the legacy workflow. */
  async create(
    userId: string,
    dto: CreateProposalDto & { filePath?: string },
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
          metadata: {
            proposalId: created.proposal.id,
            proposalTitle: created.proposal.title,
          },
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
    file?: Express.Multer.File,
  ) {
    const proposal = await this.findOne(id, accessScope);

    // Keep the existing Sales ownership check before accepting/uploading a file.
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

    const editableStatuses = new Set(["DRAFT", "SENT", "REVISION_REQUESTED"]);
    if (!editableStatuses.has(proposal.status)) {
      throw new ConflictException({
        code: "PROPOSAL_NOT_EDITABLE",
        details: { id, status: proposal.status },
      });
    }

    const { servicesList, ...scalarData } = dto;
    const updateData: Prisma.ProposalUpdateInput = {
      ...scalarData,
      ...(servicesList !== undefined
        ? { servicesList: servicesList as unknown as Prisma.InputJsonValue }
        : {}),
    };

    let uploadedKey: string | undefined;
    if (file) {
      const uploadResult = await this.storageService.upload({
        category: StorageCategory.PROPOSAL,
        entityId: id,
        file: {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      });
      uploadedKey = uploadResult.key;
      updateData.filePath = uploadedKey;
    }

    let previousFilePath = proposal.filePath;
    let committed = false;
    try {
      const updated = await this.prisma.$transaction(
        async (tx) => {
          const current = await tx.proposal.findFirst({
            where: {
              id,
              ...(accessScope?.assignedSalesId
                ? { request: buildRequestAccessWhere(accessScope) }
                : {}),
            },
            select: { status: true, createdBy: true, filePath: true },
          });
          if (!current) {
            throw new NotFoundException({
              code: "PROPOSAL_NOT_FOUND",
              details: { id },
            });
          }
          if (!isAdmin && current.createdBy !== userId) {
            throw new ForbiddenException({
              code: "PERMISSION_DENIED",
              details: { resource: "PROPOSAL", id },
            });
          }
          const editableStatuses: PrismaProposalStatus[] = [
            PrismaProposalStatus.DRAFT,
            PrismaProposalStatus.SENT,
            PrismaProposalStatus.REVISION_REQUESTED,
          ];
          if (!editableStatuses.includes(current.status)) {
            throw new ConflictException({
              code: "PROPOSAL_NOT_EDITABLE",
              details: { id, status: current.status },
            });
          }

          previousFilePath = current.filePath;
          return tx.proposal.update({ where: { id }, data: updateData });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      committed = true;

      // Only remove the old object after the database points at the replacement.
      if (uploadedKey && previousFilePath && previousFilePath !== uploadedKey) {
        await this.storageService.deleteByKey(previousFilePath);
      }
      return updated;
    } catch (error) {
      // Prevent an orphan when persistence fails after a successful upload.
      if (uploadedKey && !committed) {
        await this.storageService.deleteByKey(uploadedKey);
      }
      throw error;
    }
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
      metadata: { proposalId: proposal.id, proposalTitle: proposal.title },
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
      metadata: { proposalId: proposal.id, proposalTitle: proposal.title },
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

    const fileUrl = proposal.filePath
      ? await this.storageService.getPresignedUrl(proposal.filePath)
      : null;

    return {
      ...proposal,
      fileUrl,
      // Keep the storage key out of the client-facing URL contract.
      filePath: undefined,
    };
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
      metadata: {
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        notes: notes ?? null,
      },
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
      metadata: {
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        notes: notes ?? null,
      },
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
