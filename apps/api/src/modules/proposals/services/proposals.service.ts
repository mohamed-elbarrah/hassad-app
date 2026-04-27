import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProposalDto } from '../dto/proposal.dto';
import { ProposalStatus, PipelineStage } from '@hassad/shared';
import { randomBytes } from 'crypto';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

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

  async approve(id: string) {
    const proposal = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updatedProposal = await tx.proposal.update({
        where: { id },
        data: {
          status: ProposalStatus.APPROVED,
          approvedAt: new Date(),
        },
      });

      // Update lead stage to APPROVAL
      if (proposal.leadId) {
        await tx.lead.update({
          where: { id: proposal.leadId },
          data: { pipelineStage: PipelineStage.APPROVED },
        });
      }

      return updatedProposal;
    });
  }

  async reject(id: string) {
    return this.prisma.proposal.update({
      where: { id },
      data: { status: ProposalStatus.REJECTED },
    });
  }
}
