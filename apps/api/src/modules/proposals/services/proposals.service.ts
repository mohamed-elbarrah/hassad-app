import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProposalDto } from '../dto/proposal.dto';
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

  async send(id: string) {
    const proposal = await this.findOne(id);
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

      // Update lead stage to APPROVED and record history
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
      body: `Proposal for "${proposal.lead?.contactName ?? 'client'}" has been approved`,
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
      body: `Proposal for "${proposal.lead?.contactName ?? 'client'}" has been rejected`,
    });

    return updated;
  }
}
