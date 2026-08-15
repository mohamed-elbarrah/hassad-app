import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  Prisma,
  DisputeStatus,
  DisputeCategory,
  DisputePriority,
  DisputeThreadType,
} from "@prisma/client";
import {
  CreateDisputeDto,
  CreateDisputeMessageDto,
  DisputeFilterDto,
  ApproveDisputeDto,
  RejectDisputeDto,
  CloseDisputeDto,
  ChangePmDto,
  PmResolveDto,
  ClientConfirmDto,
} from "../dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ProjectsService } from "../../projects/services/projects.service";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";

type DisputeAudience = "admin" | "pm" | "client";

const visibleDisputeThreads: Record<DisputeAudience, DisputeThreadType[]> = {
  admin: [
    DisputeThreadType.CLIENT_PM,
    DisputeThreadType.ADMIN_CLIENT,
    DisputeThreadType.ADMIN_PM,
  ],
  pm: [DisputeThreadType.CLIENT_PM, DisputeThreadType.ADMIN_PM],
  client: [DisputeThreadType.CLIENT_PM, DisputeThreadType.ADMIN_CLIENT],
};

const writableDisputeThreads: Record<DisputeAudience, DisputeThreadType[]> = {
  admin: [DisputeThreadType.ADMIN_CLIENT, DisputeThreadType.ADMIN_PM],
  pm: [DisputeThreadType.CLIENT_PM, DisputeThreadType.ADMIN_PM],
  client: [DisputeThreadType.CLIENT_PM, DisputeThreadType.ADMIN_CLIENT],
};

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private projectsService: ProjectsService,
    private storageService: StorageService,
  ) {}

  // ─── Portal (Client) Methods ────────────────────────────────────────────────

  /**
   * Client creates a new dispute ticket
   * Business Rule: One active dispute per project per client
   */
  async createDispute(
    clientId: string,
    userId: string,
    dto: CreateDisputeDto,
    files?: Express.Multer.File[],
  ) {
    // Verify project belongs to client and get PM
    const project = await this.prisma.project.findFirst({
      where: {
        id: dto.projectId,
        clientId,
        isArchived: false,
      },
      include: {
        manager: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (!project.projectManagerId) {
      throw new BadRequestException("Project has no assigned manager");
    }

    // Check for existing active dispute for this project
    const existingDispute = await this.prisma.disputeTicket.findFirst({
      where: {
        projectId: dto.projectId,
        clientId,
        status: {
          in: [
            DisputeStatus.PENDING_APPROVAL,
            DisputeStatus.APPROVED,
            DisputeStatus.IN_PROGRESS,
            DisputeStatus.PENDING_CLIENT,
            DisputeStatus.ESCALATED,
          ],
        },
      },
    });

    if (existingDispute) {
      throw new BadRequestException("An open dispute ticket already exists for this project");
    }

    // Get next ticket number
    const lastTicket = await this.prisma.disputeTicket.findFirst({
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true },
    });
    const ticketNumber = (lastTicket?.ticketNumber ?? 0) + 1;

    // Create dispute with attachments in a transaction
    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.disputeTicket.create({
        data: {
          ticketNumber,
          clientId,
          pmId: project.projectManagerId,
          projectId: dto.projectId,
          title: dto.title,
          description: dto.description,
          category: dto.category as DisputeCategory,
          status: DisputeStatus.PENDING_APPROVAL,
          history: {
            create: {
              toStatus: DisputeStatus.PENDING_APPROVAL,
              changedBy: userId,
              note: "Ticket created",
            },
          },
        },
        include: {
          project: { select: { id: true, name: true } },
          pm: { select: { id: true, name: true } },
        },
      });

      if (files?.length) {
        await this.uploadAttachments(tx, created.id, userId, files);
      }

      return created;
    });

    // Emit notification event for admins (after transaction commits)
    this.eventEmitter.emit("dispute.created", {
      disputeId: dispute.id,
      ticketNumber: dispute.ticketNumber,
      clientId,
      projectId: dto.projectId,
      pmId: project.projectManagerId,
      title: dto.title,
    });

    // Return dispute with attachments
    return this.prisma.disputeTicket.findUnique({
      where: { id: dispute.id },
      include: {
        project: { select: { id: true, name: true } },
        pm: { select: { id: true, name: true } },
        attachments: {
          include: { uploader: { select: { id: true, name: true } } },
        },
      },
    });
  }

  /**
   * Get client's disputes with filtering
   */
  async getClientDisputes(clientId: string, filter: DisputeFilterDto) {
    const { page = 1, limit = 20, ...where } = filter;

    const whereClause: Prisma.DisputeTicketWhereInput = {
      clientId,
      ...(where.status && { status: where.status as DisputeStatus }),
      ...(where.category && { category: where.category as DisputeCategory }),
      ...(where.priority && { priority: where.priority as DisputePriority }),
      ...(where.projectId && { projectId: where.projectId }),
      ...(where.fromDate && { openedAt: { gte: new Date(where.fromDate) } }),
      ...(where.toDate && { openedAt: { lte: new Date(where.toDate) } }),
    };

    const [disputes, total] = await Promise.all([
      this.prisma.disputeTicket.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { openedAt: "desc" },
        include: {
          project: { select: { id: true, name: true } },
          pm: { select: { id: true, name: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.disputeTicket.count({ where: whereClause }),
    ]);

    return {
      data: disputes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get dispute details for client
   */
  async getClientDisputeById(clientId: string, disputeId: string) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, clientId },
      include: {
        project: { select: { id: true, name: true } },
        pm: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          where: {
            threadType: {
              in: visibleDisputeThreads.client,
            },
          },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            attachments: true,
          },
        },
        attachments: {
          include: { uploader: { select: { id: true, name: true } } },
        },
        history: {
          orderBy: { changedAt: "asc" },
          include: { changer: { select: { id: true, name: true } } },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    return dispute;
  }

  /**
   * Client adds message to dispute
   */
  async addMessage(
    disputeId: string,
    authorId: string,
    dto: CreateDisputeMessageDto,
    files?: Express.Multer.File[],
  ) {
    const threadType = dto.threadType ?? DisputeThreadType.CLIENT_PM;
    return this.addThreadMessage(
      disputeId,
      authorId,
      threadType,
      dto,
      files,
      threadType === DisputeThreadType.CLIENT_PM ? "pm" : "admin",
    );
  }

  /**
   * Client adds message to the allowed dispute thread.
   */
  async addClientThreadMessage(
    clientId: string,
    disputeId: string,
    authorId: string,
    threadType: DisputeThreadType,
    dto: CreateDisputeMessageDto,
    files?: Express.Multer.File[],
  ) {
    await this.getClientThreadContext(clientId, disputeId);
    return this.addThreadMessage(
      disputeId,
      authorId,
      threadType,
      dto,
      files,
      "client",
    );
  }

  async addPmThreadMessage(
    pmId: string,
    disputeId: string,
    threadType: DisputeThreadType,
    dto: CreateDisputeMessageDto,
    files?: Express.Multer.File[],
  ) {
    await this.getPmThreadContext(pmId, disputeId);
    return this.addThreadMessage(disputeId, pmId, threadType, dto, files, "pm");
  }

  async addAdminThreadMessage(
    adminId: string,
    disputeId: string,
    threadType: DisputeThreadType,
    dto: CreateDisputeMessageDto,
    files?: Express.Multer.File[],
  ) {
    await this.getAdminThreadContext(disputeId);
    return this.addThreadMessage(
      disputeId,
      adminId,
      threadType,
      dto,
      files,
      "admin",
    );
  }

  async getClientThreads(clientId: string, disputeId: string) {
    const dispute = await this.getClientThreadContext(clientId, disputeId);
    return this.buildThreadSummaries(dispute, "client");
  }

  async getPmThreads(pmId: string, disputeId: string) {
    const dispute = await this.getPmThreadContext(pmId, disputeId);
    return this.buildThreadSummaries(dispute, "pm");
  }

  async getAdminThreads(disputeId: string) {
    const dispute = await this.getAdminThreadContext(disputeId);
    return this.buildThreadSummaries(dispute, "admin");
  }

  async getClientThreadMessages(
    clientId: string,
    disputeId: string,
    threadType: DisputeThreadType,
  ) {
    const dispute = await this.getClientThreadContext(clientId, disputeId);
    return this.getThreadMessages(dispute, threadType, "client");
  }

  async getPmThreadMessages(
    pmId: string,
    disputeId: string,
    threadType: DisputeThreadType,
  ) {
    const dispute = await this.getPmThreadContext(pmId, disputeId);
    return this.getThreadMessages(dispute, threadType, "pm");
  }

  async getAdminThreadMessages(
    disputeId: string,
    threadType: DisputeThreadType,
  ) {
    const dispute = await this.getAdminThreadContext(disputeId);
    return this.getThreadMessages(dispute, threadType, "admin");
  }

  /**
   * Legacy message create shim. New code should use thread-specific methods.
   */
  private async addThreadMessage(
    disputeId: string,
    authorId: string,
    threadType: DisputeThreadType,
    dto: CreateDisputeMessageDto,
    files: Express.Multer.File[] | undefined,
    audience: DisputeAudience,
  ) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      select: { id: true, status: true },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    // Check if dispute allows messages
    const allowedStatuses: DisputeStatus[] = [
      DisputeStatus.APPROVED,
      DisputeStatus.IN_PROGRESS,
      DisputeStatus.PENDING_CLIENT,
      DisputeStatus.ESCALATED,
    ];

    if (!allowedStatuses.includes(dispute.status)) {
      throw new BadRequestException("Messages cannot be added to this ticket");
    }

    this.assertThreadAccess(audience, threadType, "write");

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.disputeMessage.create({
        data: {
          ticketId: disputeId,
          authorId,
          content: dto.content,
          threadType,
          isInternal: false,
        },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          attachments: true,
        },
      });

      if (files?.length) {
        await this.uploadAttachments(
          tx,
          disputeId,
          authorId,
          files,
          created.id,
        );
      }

      return created;
    });

    // Emit notification to other party (after transaction commits)
    this.eventEmitter.emit("dispute.message", {
      disputeId,
      messageId: message.id,
      authorId,
    });

    return message;
  }

  /**
   * Client confirms resolution or escalates
   */
  async clientConfirmResolution(
    clientId: string,
    userId: string,
    disputeId: string,
    dto: ClientConfirmDto,
  ) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, clientId },
      include: {
        pm: { select: { id: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    if (dispute.status !== DisputeStatus.PENDING_CLIENT) {
      throw new BadRequestException("The ticket is not awaiting client confirmation");
    }

    const now = new Date();

    // Always record that client responded
    const updateData: Prisma.DisputeTicketUpdateInput = {
      clientRespondedAt: now,
    };

    if (dto.confirmed) {
      // Client confirms resolved - close ticket
      const updated = await this.prisma.disputeTicket.update({
        where: { id: disputeId },
        data: {
          ...updateData,
          status: DisputeStatus.RESOLVED,
          clientConfirmedResolved: true,
          resolvedAt: now,
          closedAt: now,
          history: {
            create: {
              toStatus: DisputeStatus.RESOLVED,
              changedBy: userId,
              note: dto.feedback || "The client confirmed resolution",
            },
          },
        },
      });

      // Update PM stats
      await this.updatePmStats(dispute.pmId, "resolved");

      // Emit notification
      this.eventEmitter.emit("dispute.resolved", {
        disputeId,
        clientId,
        pmId: dispute.pmId,
        feedback: dto.feedback,
      });

      return updated;
    } else {
      // Client says not resolved - escalate
      const updated = await this.prisma.disputeTicket.update({
        where: { id: disputeId },
        data: {
          ...updateData,
          status: DisputeStatus.ESCALATED,
          escalatedAt: now,
          history: {
            create: {
              fromStatus: DisputeStatus.PENDING_CLIENT,
              toStatus: DisputeStatus.ESCALATED,
              changedBy: userId,
              note: dto.feedback || "The client reported that the issue is not resolved",
            },
          },
        },
      });

      // Emit notification to admins
      this.eventEmitter.emit("dispute.escalated", {
        disputeId,
        clientId,
        pmId: dispute.pmId,
        feedback: dto.feedback,
      });

      return updated;
    }
  }

  // ─── PM Methods ────────────────────────────────────────────────────────────

  /**
   * Get PM's disputes
   */
  async getPmDisputes(pmId: string, filter: DisputeFilterDto) {
    const { page = 1, limit = 20, ...where } = filter;

    const whereClause: Prisma.DisputeTicketWhereInput = {
      pmId,
      status: { notIn: [DisputeStatus.REJECTED] },
      ...(where.status && { status: where.status as DisputeStatus }),
      ...(where.category && { category: where.category as DisputeCategory }),
      ...(where.priority && { priority: where.priority as DisputePriority }),
      ...(where.projectId && { projectId: where.projectId }),
      ...(where.fromDate && { openedAt: { gte: new Date(where.fromDate) } }),
      ...(where.toDate && { openedAt: { lte: new Date(where.toDate) } }),
    };

    const [disputes, total] = await Promise.all([
      this.prisma.disputeTicket.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { openedAt: "desc" },
        select: {
          id: true,
          ticketNumber: true,
          clientId: true,
          pmId: true,
          projectId: true,
          title: true,
          category: true,
          status: true,
          priority: true,
          openedAt: true,
          deadlineAt: true,
          project: { select: { id: true, name: true } },
          client: {
            select: {
              id: true,
              companyName: true,
              user: { select: { name: true } },
            },
          },
          pm: { select: { id: true, name: true, avatarUrl: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.disputeTicket.count({ where: whereClause }),
    ]);

    return {
      data: disputes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get dispute details for PM (validates ownership)
   */
  async getPmDisputeById(pmId: string, disputeId: string) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, pmId },
      include: {
        project: { select: { id: true, name: true } },
        client: {
          select: {
            id: true,
            companyName: true,
            userId: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        pm: { select: { id: true, name: true, avatarUrl: true } },
        reviewer: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
        newPm: { select: { id: true, name: true } },
        messages: {
          where: {
            threadType: {
              in: visibleDisputeThreads.pm,
            },
          },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            attachments: true,
          },
        },
        attachments: {
          include: { uploader: { select: { id: true, name: true } } },
        },
        history: {
          orderBy: { changedAt: "asc" },
          include: { changer: { select: { id: true, name: true } } },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(
        "Ticket not found or you do not have access to it",
      );
    }

    return dispute;
  }

  async getPmDisputeWorkspace(pmId: string, disputeId: string) {
    const [detail, threads, pmStats] = await Promise.all([
      this.getPmDisputeById(pmId, disputeId),
      this.getPmThreads(pmId, disputeId),
      this.getPmStats(pmId),
    ]);

    return {
      detail,
      threads,
      pmStats,
    };
  }

  /**
   * PM marks dispute as in progress (acknowledges)
   */
  async pmAcknowledge(pmId: string, disputeId: string) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, pmId },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    if (dispute.status !== DisputeStatus.APPROVED) {
      throw new BadRequestException("This ticket cannot be edited");
    }

    return this.prisma.disputeTicket.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.IN_PROGRESS,
        history: {
          create: {
            fromStatus: DisputeStatus.APPROVED,
            toStatus: DisputeStatus.IN_PROGRESS,
            changedBy: pmId,
            note: "The project manager started processing the ticket",
          },
        },
      },
    });
  }

  /**
   * PM marks dispute as resolved (awaiting client confirmation)
   */
  async pmResolve(pmId: string, disputeId: string, dto: PmResolveDto) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, pmId },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    const allowedStatuses: DisputeStatus[] = [
      DisputeStatus.APPROVED,
      DisputeStatus.IN_PROGRESS,
      DisputeStatus.ESCALATED,
    ];

    if (!allowedStatuses.includes(dispute.status)) {
      throw new BadRequestException("This ticket cannot be resolved");
    }

    const now = new Date();

    // Add message and update status
    const [updated] = await this.prisma.$transaction([
      this.prisma.disputeTicket.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.PENDING_CLIENT,
          clientNotifiedAt: now,
          history: {
            create: {
              fromStatus: dispute.status,
              toStatus: DisputeStatus.PENDING_CLIENT,
              changedBy: pmId,
              note: "The project manager marked the issue as resolved",
            },
          },
        },
      }),
      this.prisma.disputeMessage.create({
        data: {
          ticketId: disputeId,
          authorId: pmId,
          content: dto.message,
          threadType: DisputeThreadType.CLIENT_PM,
          isInternal: false,
        },
      }),
    ]);

    // Emit notification to client
    this.eventEmitter.emit("dispute.pm_resolved", {
      disputeId,
      pmId,
      clientId: dispute.clientId,
      message: dto.message,
    });

    return updated;
  }

  // ─── Admin Methods ──────────────────────────────────────────────────────────

  /**
   * Get all disputes (admin)
   */
  async getAllDisputes(filter: DisputeFilterDto) {
    const { page = 1, limit = 20, ...where } = filter;

    const whereClause: Prisma.DisputeTicketWhereInput = {
      ...(where.status && { status: where.status as DisputeStatus }),
      ...(where.category && { category: where.category as DisputeCategory }),
      ...(where.priority && { priority: where.priority as DisputePriority }),
      ...(where.projectId && { projectId: where.projectId }),
      ...(where.clientId && { clientId: where.clientId }),
      ...(where.pmId && { pmId: where.pmId }),
      ...(where.fromDate && { openedAt: { gte: new Date(where.fromDate) } }),
      ...(where.toDate && { openedAt: { lte: new Date(where.toDate) } }),
    };

    const [disputes, total] = await Promise.all([
      this.prisma.disputeTicket.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { openedAt: "desc" },
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, companyName: true } },
          pm: { select: { id: true, name: true, avatarUrl: true } },
          reviewer: { select: { id: true, name: true } },
          resolver: { select: { id: true, name: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.disputeTicket.count({ where: whereClause }),
    ]);

    return {
      data: disputes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get dispute details (admin)
   */
  async getDisputeById(disputeId: string) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      include: {
        project: { select: { id: true, name: true } },
        client: {
          select: {
            id: true,
            companyName: true,
            userId: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        pm: { select: { id: true, name: true, avatarUrl: true } },
        reviewer: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
        newPm: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            attachments: true,
          },
        },
        attachments: {
          include: { uploader: { select: { id: true, name: true } } },
        },
        history: {
          orderBy: { changedAt: "asc" },
          include: { changer: { select: { id: true, name: true } } },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    // Get PM stats
    const pmStats = await this.getPmStats(dispute.pmId);

    return { ...dispute, pmStats };
  }

  /**
   * Admin approves dispute
   */
  async approveDispute(
    adminId: string,
    disputeId: string,
    dto: ApproveDisputeDto,
  ) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      select: { id: true, status: true, pmId: true, clientId: true },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    if (dispute.status !== DisputeStatus.PENDING_APPROVAL) {
      throw new BadRequestException("The ticket is not awaiting approval");
    }

    const now = new Date();
    const deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

    const updated = await this.prisma.disputeTicket.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.APPROVED,
        priority: dto.priority ?? DisputePriority.NORMAL,
        approvedAt: now,
        deadlineAt: deadline,
        reviewedBy: adminId,
        history: {
          create: {
            fromStatus: DisputeStatus.PENDING_APPROVAL,
            toStatus: DisputeStatus.APPROVED,
            changedBy: adminId,
            note: dto.notes || "Ticket approved",
          },
        },
      },
    });

    // Update PM stats (increment total disputes)
    await this.updatePmStats(dispute.pmId, "new");

    // Emit notification to PM
    this.eventEmitter.emit("dispute.approved", {
      disputeId,
      pmId: dispute.pmId,
      clientId: dispute.clientId,
      priority: dto.priority,
    });

    return updated;
  }

  /**
   * Admin rejects dispute
   */
  async rejectDispute(
    adminId: string,
    disputeId: string,
    dto: RejectDisputeDto,
  ) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      select: { id: true, status: true, clientId: true },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    if (dispute.status !== DisputeStatus.PENDING_APPROVAL) {
      throw new BadRequestException("The ticket is not awaiting approval");
    }

    const now = new Date();

    const updated = await this.prisma.disputeTicket.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedBy: adminId,
        closedAt: now,
        history: {
          create: {
            fromStatus: DisputeStatus.PENDING_APPROVAL,
            toStatus: DisputeStatus.REJECTED,
            changedBy: adminId,
            note: dto.reason,
          },
        },
      },
    });

    // Emit notification to client
    this.eventEmitter.emit("dispute.rejected", {
      disputeId,
      clientId: dispute.clientId,
      reason: dto.reason,
    });

    return updated;
  }

  /**
   * Admin changes PM for dispute
   */
  async changePm(adminId: string, disputeId: string, dto: ChangePmDto) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      include: {
        project: {
          select: { id: true, name: true },
        },
        pm: {
          select: { id: true, name: true },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    const allowedStatuses: DisputeStatus[] = [
      DisputeStatus.ESCALATED,
      DisputeStatus.IN_PROGRESS,
      DisputeStatus.APPROVED,
    ];

    if (!allowedStatuses.includes(dispute.status)) {
      throw new BadRequestException("The project manager cannot be changed for this ticket");
    }

    const now = new Date();
    const oldPmId = dispute.pmId;
    const oldPmName = dispute.pm?.name || "Previous project manager";

    // Use transaction for atomic operation
    const result = await this.prisma.$transaction(async (tx) => {
      // Change project manager via ProjectsService
      const pmChangeResult = await this.projectsService.changeProjectManager(
        dispute.projectId,
        dto.newPmId,
        { reason: dto.reason },
        tx,
      );

      // Update dispute ticket
      const updated = await tx.disputeTicket.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          pmChanged: true,
          newPmId: dto.newPmId,
          resolvedBy: adminId,
          resolvedAt: now,
          closedAt: now,
          resolution: `Project manager changed. Reason: ${dto.reason}`,
          history: {
            create: {
              fromStatus: dispute.status,
              toStatus: DisputeStatus.RESOLVED,
              changedBy: adminId,
              note: `Project manager changed from ${oldPmName} to ${pmChangeResult.newPm.name}. Reason: ${dto.reason}`,
            },
          },
        },
      });

      return { updated, pmChangeResult };
    });

    // Update PM stats (outside transaction to avoid rollback on notification failure)
    await this.updatePmStats(oldPmId, "pm_changed");
    await this.updatePmStats(dto.newPmId, "assigned");

    // Emit notifications (outside transaction to avoid rollback on notification failure)
    this.eventEmitter.emit("dispute.pm_changed", {
      disputeId,
      oldPmId,
      newPmId: dto.newPmId,
      clientId: dispute.clientId,
      reason: dto.reason,
    });

    return result.updated;
  }

  /**
   * Admin closes dispute
   */
  async closeDispute(adminId: string, disputeId: string, dto: CloseDisputeDto) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      select: { id: true, status: true, pmId: true },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    const allowedStatuses: DisputeStatus[] = [
      DisputeStatus.ESCALATED,
      DisputeStatus.IN_PROGRESS,
      DisputeStatus.APPROVED,
      DisputeStatus.PENDING_CLIENT,
    ];

    if (!allowedStatuses.includes(dispute.status)) {
      throw new BadRequestException("This ticket cannot be closed");
    }

    const now = new Date();

    const updated = await this.prisma.disputeTicket.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.CLOSED,
        resolution: dto.resolution,
        resolvedBy: adminId,
        resolvedAt: now,
        closedAt: now,
        history: {
          create: {
            fromStatus: dispute.status,
            toStatus: DisputeStatus.CLOSED,
            changedBy: adminId,
            note: dto.resolution,
          },
        },
      },
    });

    // Emit notification
    this.eventEmitter.emit("dispute.closed", {
      disputeId,
      pmId: dispute.pmId,
      resolution: dto.resolution,
    });

    return updated;
  }

  /**
   * Get PM dispute statistics
   */
  async getPmStats(pmId: string) {
    const stats = await this.prisma.pmDisputeStats.findUnique({
      where: { userId: pmId },
    });

    if (!stats) {
      return {
        userId: pmId,
        totalDisputes: 0,
        resolvedDisputes: 0,
        escalatedDisputes: 0,
        pmChangedCount: 0,
        avgResolutionDays: 0,
      };
    }

    return stats;
  }

  /**
   * Get admin dispute statistics
   */
  async getAdminStats() {
    const [pendingApproval, active, escalated, resolved, closed] =
      await Promise.all([
        // Pending approval
        this.prisma.disputeTicket.count({
          where: { status: DisputeStatus.PENDING_APPROVAL },
        }),
        // Active (approved or in progress)
        this.prisma.disputeTicket.count({
          where: {
            status: {
              in: [
                DisputeStatus.APPROVED,
                DisputeStatus.IN_PROGRESS,
                DisputeStatus.PENDING_CLIENT,
              ],
            },
          },
        }),
        // Escalated
        this.prisma.disputeTicket.count({
          where: { status: DisputeStatus.ESCALATED },
        }),
        // Resolved
        this.prisma.disputeTicket.count({
          where: { status: DisputeStatus.RESOLVED },
        }),
        // Closed
        this.prisma.disputeTicket.count({
          where: { status: DisputeStatus.CLOSED },
        }),
      ]);

    return {
      pendingApproval,
      active,
      escalated,
      resolved,
      closed,
    };
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────

  private assertThreadAccess(
    audience: DisputeAudience,
    threadType: DisputeThreadType,
    action: "read" | "write",
  ) {
    const allowed =
      action === "read"
        ? visibleDisputeThreads[audience]
        : writableDisputeThreads[audience];

    if (!allowed.includes(threadType)) {
      throw new ForbiddenException("You do not have access to this conversation");
    }
  }

  private async getClientThreadContext(clientId: string, disputeId: string) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, clientId },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        clientId: true,
        pmId: true,
        client: {
          select: {
            id: true,
            companyName: true,
            userId: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        pm: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    return dispute;
  }

  private async getPmThreadContext(pmId: string, disputeId: string) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, pmId },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        clientId: true,
        pmId: true,
        client: {
          select: {
            id: true,
            companyName: true,
            userId: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        pm: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException(
        "Ticket not found or you do not have access to it",
      );
    }

    return dispute;
  }

  private async getAdminThreadContext(disputeId: string) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        clientId: true,
        pmId: true,
        client: {
          select: {
            id: true,
            companyName: true,
            userId: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        pm: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException("Ticket not found");
    }

    return dispute;
  }

  private threadMeta(
    dispute: Awaited<ReturnType<DisputesService["getAdminThreadContext"]>>,
    threadType: DisputeThreadType,
  ) {
    const clientName =
      dispute.client?.companyName ??
      dispute.client?.user?.name ??
      "Client";
    const pmName = dispute.pm?.name ?? "PM";

    if (threadType === DisputeThreadType.CLIENT_PM) {
      return {
        threadType,
        title: "Client ↔ PM",
        description: "Private resolution thread between the client and the assigned PM.",
        participantsLabel: `${clientName} and ${pmName}`,
      };
    }

    if (threadType === DisputeThreadType.ADMIN_CLIENT) {
      return {
        threadType,
        title: "Admin ↔ Client",
        description: "Private thread visible only to admins and the client.",
        participantsLabel: `Admins and ${clientName}`,
      };
    }

    return {
      threadType,
      title: "Admin ↔ PM",
      description: "Private thread visible only to admins and the assigned PM.",
      participantsLabel: `Admins and ${pmName}`,
    };
  }

  private authorRole(
    dispute: Awaited<ReturnType<DisputesService["getAdminThreadContext"]>>,
    authorId: string,
  ) {
    if (authorId === dispute.pmId) {
      return "PM";
    }

    if (authorId === dispute.client?.userId) {
      return "CLIENT";
    }

    return "ADMIN";
  }

  private async attachDisputeUrls(attachments: Array<any>) {
    const keys = attachments.map((attachment) => attachment.filePath);
    const urlMap = await this.storageService.getMultiplePresignedUrls(keys);

    return attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      filePath: attachment.filePath,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      uploadedAt: attachment.uploadedAt?.toISOString?.() ?? null,
      url: urlMap.get(attachment.filePath) ?? null,
    }));
  }

  private async threadMessageResponse(
    dispute: Awaited<ReturnType<DisputesService["getAdminThreadContext"]>>,
    message: any,
  ) {
    const attachments =
      message.attachments?.length > 0
        ? await this.attachDisputeUrls(message.attachments)
        : [];

    return {
      id: message.id,
      threadType: message.threadType,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      author: {
        id: message.author.id,
        name: message.author.name,
        avatarUrl: message.author.avatarUrl ?? null,
        role: this.authorRole(dispute, message.author.id),
      },
      attachments,
    };
  }

  private async getThreadMessages(
    dispute: Awaited<ReturnType<DisputesService["getAdminThreadContext"]>>,
    threadType: DisputeThreadType,
    audience: DisputeAudience,
  ) {
    this.assertThreadAccess(audience, threadType, "read");

    const messages = await this.prisma.disputeMessage.findMany({
      where: {
        ticketId: dispute.id,
        threadType,
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        attachments: true,
      },
    });

    return Promise.all(
      messages.map((message) => this.threadMessageResponse(dispute, message)),
    );
  }

  private async buildThreadSummaries(
    dispute: Awaited<ReturnType<DisputesService["getAdminThreadContext"]>>,
    audience: DisputeAudience,
  ) {
    const allowedThreads = visibleDisputeThreads[audience];
    const counts = await this.prisma.disputeMessage.groupBy({
      by: ["threadType"],
      where: {
        ticketId: dispute.id,
        threadType: { in: allowedThreads },
      },
      _count: { id: true },
    });

    const latestMessages = await this.prisma.disputeMessage.findMany({
      where: {
        ticketId: dispute.id,
        threadType: { in: allowedThreads },
      },
      orderBy: [{ threadType: "asc" }, { createdAt: "desc" }],
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const countMap = new Map(
      counts.map((item) => [item.threadType, item._count.id]),
    );
    const lastMessageMap = new Map<string, any>();

    for (const message of latestMessages) {
      if (!lastMessageMap.has(message.threadType)) {
        lastMessageMap.set(message.threadType, message);
      }
    }

    return allowedThreads.map((threadType) => {
      const meta = this.threadMeta(dispute, threadType);
      const lastMessage = lastMessageMap.get(threadType);

      return {
        ...meta,
        canReply: writableDisputeThreads[audience].includes(threadType),
        messageCount: countMap.get(threadType) ?? 0,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt.toISOString(),
              authorName: lastMessage.author.name,
              authorRole: this.authorRole(dispute, lastMessage.author.id),
            }
          : null,
      };
    });
  }

  /**
   * Upload files and create attachment records within a transaction.
   * Used by both createDispute and addMessage to avoid duplication.
   */
  private async uploadAttachments(
    tx: Prisma.TransactionClient,
    ticketId: string,
    uploadedBy: string,
    files: Express.Multer.File[],
    messageId?: string,
  ): Promise<void> {
    const attachmentData = await Promise.all(
      files.map(async (file) => {
        const result = await this.storageService.upload({
          category: StorageCategory.DISPUTE_ATTACHMENT,
          entityId: ticketId,
          file: {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          },
        });
        return {
          ticketId,
          ...(messageId && { messageId }),
          uploadedBy,
          fileName: result.originalName,
          filePath: result.key,
          fileSize: result.size,
          mimeType: result.mimeType,
        };
      }),
    );

    await tx.disputeAttachment.createMany({ data: attachmentData });
  }

  /**
   * Update PM dispute statistics
   */
  private async updatePmStats(
    pmId: string,
    event: "new" | "resolved" | "escalated" | "pm_changed" | "assigned",
  ) {
    // Get current stats or create
    let stats = await this.prisma.pmDisputeStats.findUnique({
      where: { userId: pmId },
    });

    if (!stats) {
      stats = await this.prisma.pmDisputeStats.create({
        data: { userId: pmId },
      });
    }

    // Calculate updates based on event
    const updates: Prisma.PmDisputeStatsUpdateInput = {};

    switch (event) {
      case "new":
        updates.totalDisputes = { increment: 1 };
        break;
      case "resolved": {
        updates.resolvedDisputes = { increment: 1 };
        // Recalculate avg resolution days
        const resolvedDisputes = await this.prisma.disputeTicket.findMany({
          where: {
            pmId,
            status: DisputeStatus.RESOLVED,
            approvedAt: { not: null },
            resolvedAt: { not: null },
          },
          select: { approvedAt: true, resolvedAt: true },
        });
        if (resolvedDisputes.length > 0) {
          const totalDays = resolvedDisputes.reduce((sum, d) => {
            if (d.approvedAt && d.resolvedAt) {
              const days =
                (d.resolvedAt.getTime() - d.approvedAt.getTime()) /
                (1000 * 60 * 60 * 24);
              return sum + days;
            }
            return sum;
          }, 0);
          updates.avgResolutionDays = totalDays / resolvedDisputes.length;
        }
        break;
      }
      case "escalated":
        updates.escalatedDisputes = { increment: 1 };
        break;
      case "pm_changed":
        updates.pmChangedCount = { increment: 1 };
        break;
    }

    updates.lastUpdated = new Date();

    return this.prisma.pmDisputeStats.update({
      where: { userId: pmId },
      data: updates,
    });
  }

  /**
   * Check for disputes past deadline (for cron job)
   */
  async checkDeadlineDisputes() {
    const now = new Date();

    // Get system user ID (first admin) for automated actions
    const systemUser = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        role: { name: "ADMIN" },
      },
      select: { id: true },
    });

    if (!systemUser) {
      // No admin user found, skip this run
      return { escalated: 0, error: "No admin user found for system actions" };
    }

    const pastDeadline = await this.prisma.disputeTicket.findMany({
      where: {
        status: { in: [DisputeStatus.APPROVED, DisputeStatus.IN_PROGRESS] },
        deadlineAt: { lt: now },
      },
    });

    for (const dispute of pastDeadline) {
      await this.prisma.disputeTicket.update({
        where: { id: dispute.id },
        data: {
          status: DisputeStatus.ESCALATED,
          escalatedAt: now,
          history: {
            create: {
              fromStatus: dispute.status as DisputeStatus,
              toStatus: DisputeStatus.ESCALATED,
              changedBy: systemUser.id,
              note: "Automatically escalated because the deadline expired",
            },
          },
        },
      });

      this.eventEmitter.emit("dispute.auto_escalated", {
        disputeId: dispute.id,
        pmId: dispute.pmId,
      });
    }

    return { escalated: pastDeadline.length };
  }
}
