import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateProposalDto, UpdateProposalDto } from "../dto/proposal.dto";
import { ProposalStatus, RequestStatus } from "@hassad/shared";
import { randomBytes } from "crypto";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { RequestsService } from "../../requests/requests.service";

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private requestsService: RequestsService,
  ) {}

  /**
   * One-step: create proposal as DRAFT then immediately send it.
   * Notifies the CLIENT linked to the originating request.
   */
  async create(userId: string, dto: CreateProposalDto) {
    const token = randomBytes(32).toString("hex");

    const created = await this.prisma.$transaction(async (tx) => {
      const request = await this.requestsService.resolveRequestContext(
        { requestId: dto.requestId },
        userId,
        tx,
      );
      const leadId = request.lead?.id ?? null;

      const proposal = await tx.proposal.create({
        data: {
          requestId: request.id,
          leadId,
          clientId: request.clientId,
          createdBy: userId,
          title: dto.title,
          serviceDescription: dto.serviceDescription ?? "",
          servicesList: dto.servicesList ?? [],
          totalPrice: dto.totalPrice ?? 0,
          durationDays: dto.durationDays ?? 0,
          platforms: dto.platforms ?? [],
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

  async findAll(filters: {
    status?: string;
    leadId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.search)
      where.title = { contains: filters.search, mode: "insensitive" };

    const [items, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        include: {
          request: true,
          lead: { select: { id: true, contactName: true, companyName: true } },
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

  async findOne(id: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        request: true,
        lead: true,
        creator: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    return proposal;
  }

  async update(id: string, dto: UpdateProposalDto) {
    return this.prisma.proposal.update({
      where: { id },
      data: dto,
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
            contactName: true,
            status: true,
          },
        },
        lead: true,
        creator: { select: { id: true, name: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundException("Proposal not found or link is invalid");
    }

    return proposal;
  }

  async approveByToken(token: string, notes?: string) {
    const proposal = await this.findByToken(token);

    if (proposal.status !== ProposalStatus.SENT) {
      throw new BadRequestException(
        "Proposal cannot be approved in its current state",
      );
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
      throw new BadRequestException(
        "Proposal cannot be revised in its current state",
      );
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
   * CLIENT portal: return all proposals linked to leads where createdBy = userId.
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
            contactName: true,
            status: true,
          },
        },
        lead: { select: { id: true, contactName: true, companyName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
