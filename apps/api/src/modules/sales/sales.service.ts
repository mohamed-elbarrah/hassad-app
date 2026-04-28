import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PipelineStage, ProposalStatus, ContractStatus, ClientStatus } from '@hassad/shared';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async getMetrics() {
    const [
      totalLeads,
      activeClients,
      stoppedClients,
      meetingsScheduled,
      proposalsSent,
      signedContracts,
      stageRows,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { isActive: true } }),
      this.prisma.client.count({ where: { status: ClientStatus.ACTIVE } }),
      this.prisma.client.count({ where: { status: ClientStatus.STOPPED } }),
      this.prisma.lead.count({ where: { pipelineStage: PipelineStage.MEETING_SCHEDULED } }),
      this.prisma.proposal.count({ where: { status: { not: ProposalStatus.DRAFT } } }),
      this.prisma.contract.count({ where: { status: ContractStatus.SIGNED } }),
      this.prisma.lead.groupBy({
        by: ['pipelineStage'],
        _count: { pipelineStage: true },
        where: { isActive: true },
      }),
    ]);

    const closeRate =
      totalLeads > 0 ? Math.round((signedContracts / totalLeads) * 100 * 10) / 10 : 0;

    const stageBreakdown: Partial<Record<PipelineStage, number>> = {};
    for (const row of stageRows) {
      stageBreakdown[row.pipelineStage] = row._count.pipelineStage;
    }

    return {
      totals: { totalLeads, activeClients, stoppedClients },
      meetingsScheduled,
      proposalsSent,
      signedContracts,
      closeRate,
      stageBreakdown,
    };
  }
}
