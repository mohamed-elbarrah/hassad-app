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

  async getPerformance(period?: string) {
    const now = new Date();
    let since: Date;

    switch (period) {
      case 'week':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        since = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        since = new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1);
        break;
      default:
        since = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      newLeads,
      convertedLeads,
      proposalsCreated,
      contractsSigned,
      totalContractValue,
      leadsBySource,
      conversionByStage,
    ] = await Promise.all([
      this.prisma.lead.count({
        where: { isActive: true, createdAt: { gte: since } },
      }),
      this.prisma.client.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.proposal.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.contract.count({
        where: { status: ContractStatus.SIGNED, createdAt: { gte: since } },
      }),
      this.prisma.contract.aggregate({
        _sum: { totalValue: true },
        where: { status: ContractStatus.SIGNED, createdAt: { gte: since } },
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        _count: { source: true },
        where: { isActive: true, createdAt: { gte: since } },
      }),
      this.prisma.lead.groupBy({
        by: ['pipelineStage'],
        _count: { pipelineStage: true },
        where: { isActive: true, createdAt: { gte: since } },
      }),
    ]);

    return {
      period: period || 'month',
      since,
      newLeads,
      convertedLeads,
      conversionRate: newLeads > 0 ? Math.round((convertedLeads / newLeads) * 1000) / 10 : 0,
      proposalsCreated,
      contractsSigned,
      totalContractValue: totalContractValue._sum.totalValue || 0,
      averageContractValue: contractsSigned > 0
        ? Math.round((totalContractValue._sum.totalValue || 0) / contractsSigned * 100) / 100
        : 0,
      leadsBySource: leadsBySource.reduce((acc, r) => {
        acc[r.source] = r._count.source;
        return acc;
      }, {} as Record<string, number>),
      conversionByStage: conversionByStage.reduce((acc, r) => {
        acc[r.pipelineStage] = r._count.pipelineStage;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getActivity(limit: number) {
    const [recentLeads, recentProposals, recentContracts] = await Promise.all([
      this.prisma.lead.findMany({
        where: { isActive: true },
        select: {
          id: true,
          companyName: true,
          pipelineStage: true,
          createdAt: true,
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.proposal.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          lead: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.contract.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          totalValue: true,
          createdAt: true,
          client: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const activities = [
      ...recentLeads.map((l) => ({
        type: 'lead' as const,
        id: l.id,
        title: l.companyName,
        detail: l.pipelineStage,
        createdAt: l.createdAt,
        assignee: l.assignee?.name,
      })),
      ...recentProposals.map((p) => ({
        type: 'proposal' as const,
        id: p.id,
        title: p.title,
        detail: p.status,
        createdAt: p.createdAt,
        client: p.lead?.companyName,
      })),
      ...recentContracts.map((c) => ({
        type: 'contract' as const,
        id: c.id,
        title: c.title,
        detail: c.status,
        createdAt: c.createdAt,
        value: c.totalValue,
        client: c.client?.companyName,
      })),
    ];

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activities.slice(0, limit);
  }
}
