import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, DisputeStatus, DisputeCategory, DisputePriority } from "@prisma/client";
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
  async createDispute(clientId: string, dto: CreateDisputeDto, files?: Express.Multer.File[]) {
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
      throw new NotFoundException("المشروع غير موجود");
    }

    if (!project.projectManagerId) {
      throw new BadRequestException("المشروع ليس لديه مدير مخصص");
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
      throw new BadRequestException("يوجد تذكرة مفتوحة لهذا المشروع بالفعل");
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
              changedBy: clientId,
              note: "تم إنشاء التذكرة",
            },
          },
        },
        include: {
          project: { select: { id: true, name: true } },
          pm: { select: { id: true, name: true } },
        },
      });

      if (files?.length) {
        await this.uploadAttachments(tx, created.id, clientId, files);
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
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
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
      throw new NotFoundException("التذكرة غير موجودة");
    }

    return dispute;
  }

  /**
   * Client adds message to dispute
   */
  async addMessage(disputeId: string, authorId: string, dto: CreateDisputeMessageDto, files?: Express.Multer.File[]) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      select: { id: true, status: true },
    });

    if (!dispute) {
      throw new NotFoundException("التذكرة غير موجودة");
    }

    // Check if dispute allows messages
    const allowedStatuses: DisputeStatus[] = [
      DisputeStatus.APPROVED,
      DisputeStatus.IN_PROGRESS,
      DisputeStatus.PENDING_CLIENT,
      DisputeStatus.ESCALATED,
    ];

    if (!allowedStatuses.includes(dispute.status)) {
      throw new BadRequestException("لا يمكن إضافة رسائل لهذه التذكرة");
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.disputeMessage.create({
        data: {
          ticketId: disputeId,
          authorId,
          content: dto.content,
          isInternal: dto.isInternal ?? false,
        },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      if (files?.length) {
        await this.uploadAttachments(tx, disputeId, authorId, files, created.id);
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
  async clientConfirmResolution(clientId: string, disputeId: string, dto: ClientConfirmDto) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, clientId },
      include: {
        pm: { select: { id: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException("التذكرة غير موجودة");
    }

    if (dispute.status !== DisputeStatus.PENDING_CLIENT) {
      throw new BadRequestException("التذكرة ليست في حالة انتظار تأكيد العميل");
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
              changedBy: clientId,
              note: dto.feedback || "أكد العميل حل المشكلة",
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
              changedBy: clientId,
              note: dto.feedback || "العميل يؤكد عدم حل المشكلة",
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
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, companyName: true,  } },
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
   * Get dispute details for PM (validates ownership)
   */
  async getPmDisputeById(pmId: string, disputeId: string) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, pmId },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true,  } },
        messages: {
          where: { isInternal: false }, // PM cannot see internal admin notes
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        history: {
          orderBy: { changedAt: "asc" },
          include: { changer: { select: { id: true, name: true } } },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException("التذكرة غير موجودة أو ليس لديك صلاحية للوصول إليها");
    }

    return dispute;
  }

  /**
   * PM marks dispute as in progress (acknowledges)
   */
  async pmAcknowledge(pmId: string, disputeId: string) {
    const dispute = await this.prisma.disputeTicket.findFirst({
      where: { id: disputeId, pmId },
    });

    if (!dispute) {
      throw new NotFoundException("التذكرة غير موجودة");
    }

    if (dispute.status !== DisputeStatus.APPROVED) {
      throw new BadRequestException("لا يمكن تعديل هذه التذكرة");
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
            note: "بدأ مدير المشروع في معالجة التذكرة",
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
      throw new NotFoundException("التذكرة غير موجودة");
    }

    const allowedStatuses: DisputeStatus[] = [
      DisputeStatus.APPROVED,
      DisputeStatus.IN_PROGRESS,
    ];

    if (!allowedStatuses.includes(dispute.status)) {
      throw new BadRequestException("لا يمكن حل هذه التذكرة");
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
              note: "مدير المشروع أشار إلى حل المشكلة",
            },
          },
        },
      }),
      this.prisma.disputeMessage.create({
        data: {
          ticketId: disputeId,
          authorId: pmId,
          content: dto.message,
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
          client: { select: { id: true, companyName: true,  } },
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
        client: { select: { id: true, companyName: true } },
        pm: { select: { id: true, name: true, avatarUrl: true } },
        reviewer: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
        newPm: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
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
      throw new NotFoundException("التذكرة غير موجودة");
    }

    // Get PM stats
    const pmStats = await this.getPmStats(dispute.pmId);

    return { ...dispute, pmStats };
  }

  /**
   * Admin approves dispute
   */
  async approveDispute(adminId: string, disputeId: string, dto: ApproveDisputeDto) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      select: { id: true, status: true, pmId: true, clientId: true },
    });

    if (!dispute) {
      throw new NotFoundException("التذكرة غير موجودة");
    }

    if (dispute.status !== DisputeStatus.PENDING_APPROVAL) {
      throw new BadRequestException("التذكرة ليست في حالة انتظار الموافقة");
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
            note: dto.notes || "تمت الموافقة على التذكرة",
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
  async rejectDispute(adminId: string, disputeId: string, dto: RejectDisputeDto) {
    const dispute = await this.prisma.disputeTicket.findUnique({
      where: { id: disputeId },
      select: { id: true, status: true, clientId: true },
    });

    if (!dispute) {
      throw new NotFoundException("التذكرة غير موجودة");
    }

    if (dispute.status !== DisputeStatus.PENDING_APPROVAL) {
      throw new BadRequestException("التذكرة ليست في حالة انتظار الموافقة");
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
      throw new NotFoundException("التذكرة غير موجودة");
    }

    const allowedStatuses: DisputeStatus[] = [
      DisputeStatus.ESCALATED,
      DisputeStatus.IN_PROGRESS,
      DisputeStatus.APPROVED,
    ];

    if (!allowedStatuses.includes(dispute.status)) {
      throw new BadRequestException("لا يمكن تغيير مدير المشروع لهذه التذكرة");
    }

    const now = new Date();
    const oldPmId = dispute.pmId;
    const oldPmName = dispute.pm?.name || "مدير المشروع السابق";

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
          resolution: `تم تغيير مدير المشروع. السبب: ${dto.reason}`,
          history: {
            create: {
              fromStatus: dispute.status,
              toStatus: DisputeStatus.RESOLVED,
              changedBy: adminId,
              note: `تم تغيير مدير المشروع من ${oldPmName} إلى ${pmChangeResult.newPm.name}. السبب: ${dto.reason}`,
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
      throw new NotFoundException("التذكرة غير موجودة");
    }

    const allowedStatuses: DisputeStatus[] = [
      DisputeStatus.ESCALATED,
      DisputeStatus.IN_PROGRESS,
      DisputeStatus.APPROVED,
      DisputeStatus.PENDING_CLIENT,
    ];

    if (!allowedStatuses.includes(dispute.status)) {
      throw new BadRequestException("لا يمكن إغلاق هذه التذكرة");
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
    const [
      pendingApproval,
      active,
      escalated,
      resolved,
      closed,
    ] = await Promise.all([
      // Pending approval
      this.prisma.disputeTicket.count({
        where: { status: DisputeStatus.PENDING_APPROVAL },
      }),
      // Active (approved or in progress)
      this.prisma.disputeTicket.count({
        where: { status: { in: [DisputeStatus.APPROVED, DisputeStatus.IN_PROGRESS, DisputeStatus.PENDING_CLIENT] } },
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
      })
    );

    await tx.disputeAttachment.createMany({ data: attachmentData });
  }

  /**
   * Update PM dispute statistics
   */
  private async updatePmStats(pmId: string, event: "new" | "resolved" | "escalated" | "pm_changed" | "assigned") {
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
      case "resolved":
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
              const days = (d.resolvedAt.getTime() - d.approvedAt.getTime()) / (1000 * 60 * 60 * 24);
              return sum + days;
            }
            return sum;
          }, 0);
          updates.avgResolutionDays = totalDays / resolvedDisputes.length;
        }
        break;
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
              note: "تم التصعيد تلقائياً لانتهاء المهلة",
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