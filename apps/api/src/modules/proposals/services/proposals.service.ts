import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProposalDto, UpdateProposalDto } from '../dto/proposal.dto';
import { ProposalStatus, PipelineStage } from '@hassad/shared';
import { randomBytes } from 'crypto';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateProposalDto) {
    return this.prisma.proposal.create({
      data: {
        ...dto,
        createdBy: userId,
        status: ProposalStatus.DRAFT,
      },
    });
  }

  async findAll(filters: { status?: string; leadId?: string; search?: string; page?: number; limit?: number }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.search) where.title = { contains: filters.search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        include: {
          lead: { select: { id: true, contactName: true, companyName: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
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
    const token = randomBytes(32).toString('hex');

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

      if (proposal.leadId) {
        const lead = await tx.lead.findUnique({
          where: { id: proposal.leadId },
          select: { pipelineStage: true },
        });

        await tx.lead.update({
          where: { id: proposal.leadId },
          data: { pipelineStage: PipelineStage.APPROVED },
        });

        if (lead) {
          await tx.leadPipelineHistory.create({
            data: {
              leadId: proposal.leadId,
              fromStage: lead.pipelineStage,
              toStage: PipelineStage.APPROVED,
              changedBy: userId,
            },
          });
        }
      }

      return updated;
    });

    await this.notificationsService.createNotification({
      entityId: proposal.id,
      entityType: 'proposal',
      eventType: 'PROPOSAL_APPROVED',
      userId: proposal.createdBy,
      title: 'Proposal Approved',
      body: `Proposal "${proposal.title}" has been approved`,
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
      entityType: 'proposal',
      eventType: 'PROPOSAL_REJECTED',
      userId: proposal.createdBy,
      title: 'Proposal Rejected',
      body: `Proposal "${proposal.title}" has been rejected`,
    });

    return updated;
  }

  async findByToken(token: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { shareLinkToken: token },
      include: {
        lead: true,
        creator: { select: { id: true, name: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found or link is invalid');
    }

    return proposal;
  }

  async approveByToken(token: string, notes?: string) {
    const proposal = await this.findByToken(token);

    if (proposal.status !== ProposalStatus.SENT) {
      throw new BadRequestException('Proposal cannot be approved in its current state');
    }

    const updated = await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: ProposalStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    await this.notificationsService.createNotification({
      entityId: proposal.id,
      entityType: 'proposal',
      eventType: 'PROPOSAL_APPROVED_BY_CLIENT',
      userId: proposal.createdBy,
      title: 'Proposal Approved by Client',
      body: `Proposal "${proposal.title}" has been approved by the client`,
    });

    return { id: updated.id, status: updated.status, approvedAt: updated.approvedAt };
  }

  async revisionByToken(token: string, notes?: string) {
    const proposal = await this.findByToken(token);

    if (proposal.status !== ProposalStatus.SENT) {
      throw new BadRequestException('Proposal cannot be revised in its current state');
    }

    const updated = await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.REVISION_REQUESTED },
    });

    await this.notificationsService.createNotification({
      entityId: proposal.id,
      entityType: 'proposal',
      eventType: 'PROPOSAL_REVISION_REQUESTED',
      userId: proposal.createdBy,
      title: 'Proposal Revision Requested',
      body: `Client requested revision on proposal "${proposal.title}"${notes ? ': ' + notes : ''}`,
    });

    return { id: updated.id, status: updated.status, revisionNotes: notes ?? null };
  }
}
