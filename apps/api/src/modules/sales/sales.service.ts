import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  ContractStatus,
  ClientStatus,
  ProposalStatus,
  RequestStatus,
} from "@hassad/shared";

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(period?: string) {
    const now = new Date();
    let since: Date | undefined;

    switch (period) {
      case "last7days":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last30days":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "lastYear":
        since = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        since = undefined;
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const requestWhere: Prisma.RequestWhereInput = {};
    const contractWhere: Prisma.ContractWhereInput = {};

    if (since) {
      requestWhere.createdAt = { gte: since };
      contractWhere.signedAt = { gte: since };
    }

    const [
      totalLeads,
      activeClients,
      stoppedClients,
      meetingsScheduled,
      proposalsSent,
      signedContracts,
      stageRows,
      activeDeals,
      staleDeals,
      signedInPeriod,
      pipelineValueAgg,
      avgDealSizeAgg,
      dealsByStatusRows,
      valueByStageRows,
    ] = await Promise.all([
      this.prisma.request.count({
        where: since ? { createdAt: { gte: since } } : undefined,
      }),
      this.prisma.client.count({ where: { status: ClientStatus.ACTIVE } }),
      this.prisma.client.count({ where: { status: ClientStatus.STOPPED } }),
      this.prisma.request.count({
        where: {
          status: RequestStatus.PROPOSAL_IN_PROGRESS,
          ...(since ? { createdAt: { gte: since } } : {}),
        },
      }),
      this.prisma.proposal.count({
        where: {
          status: { not: ProposalStatus.DRAFT },
          ...(since ? { createdAt: { gte: since } } : {}),
        },
      }),
      this.prisma.contract.count({
        where: { status: ContractStatus.SIGNED, ...contractWhere },
      }),
      this.prisma.request.groupBy({
        by: ["status"],
        _count: { status: true },
        where: since ? { createdAt: { gte: since } } : undefined,
      }),
      this.prisma.request.count({
        where: {
          ...requestWhere,
          status: {
            notIn: [RequestStatus.CANCELLED, RequestStatus.PROJECT_CREATED],
          },
        },
      }),
      this.prisma.request.count({
        where: {
          ...requestWhere,
          updatedAt: { lt: sevenDaysAgo },
          status: {
            notIn: [RequestStatus.CANCELLED, RequestStatus.PROJECT_CREATED],
          },
        },
      }),
      this.prisma.contract.count({
        where: { status: ContractStatus.SIGNED, ...contractWhere },
      }),
      this.prisma.contract.aggregate({
        _sum: { totalValue: true },
        where: { status: ContractStatus.SIGNED, ...contractWhere },
      }),
      this.prisma.contract.aggregate({
        _avg: { totalValue: true },
        where: { status: ContractStatus.SIGNED, ...contractWhere },
      }),
      this.prisma.request.groupBy({
        by: ["status"],
        _count: { status: true },
        where: {
          ...requestWhere,
          status: {
            notIn: [RequestStatus.CANCELLED, RequestStatus.PROJECT_CREATED],
          },
        },
      }),
      this.prisma.contract.groupBy({
        by: ["status"],
        _sum: { totalValue: true },
        where: {
          status: {
            in: [ContractStatus.SIGNED, ContractStatus.ACTIVE, ContractStatus.ON_HOLD],
          },
          ...contractWhere,
        },
      }),
    ]);

    const closeRate =
      totalLeads > 0
        ? Math.round((signedContracts / totalLeads) * 100 * 10) / 10
        : 0;

    const stageBreakdown: Record<string, number> = {};
    for (const row of stageRows) {
      stageBreakdown[row.status] = row._count.status;
    }

    const dealsByStage: Record<string, number> = {};
    for (const row of dealsByStatusRows) {
      dealsByStage[row.status] = row._count.status;
    }

    const valueByStage: Record<string, number> = {};
    for (const row of valueByStageRows) {
      valueByStage[row.status] = row._sum.totalValue ?? 0;
    }

    return {
      totals: { totalLeads, activeClients, stoppedClients },
      meetingsScheduled,
      proposalsSent,
      signedContracts,
      closeRate,
      stageBreakdown,
      pipelineValue: pipelineValueAgg._sum.totalValue ?? 0,
      activeDeals,
      staleDeals,
      signedThisMonth: signedInPeriod,
      avgDealSize: avgDealSizeAgg._avg.totalValue
        ? Math.round(avgDealSizeAgg._avg.totalValue * 100) / 100
        : 0,
      dealsByStage,
      valueByStage,
    };
  }

  async getPerformance(period?: string) {
    const now = new Date();
    let since: Date;

    switch (period) {
      case "week":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        since = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        since = new Date(
          now.getFullYear(),
          now.getMonth() - (now.getMonth() % 3),
          1,
        );
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
      this.prisma.request.count({ where: { createdAt: { gte: since } } }),
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
      this.prisma.request.groupBy({
        by: ["source"],
        _count: { source: true },
        where: { createdAt: { gte: since } },
      }),
      this.prisma.request.groupBy({
        by: ["status"],
        _count: { status: true },
        where: { createdAt: { gte: since } },
      }),
    ]);

    return {
      period: period || "month",
      since,
      newLeads,
      convertedLeads,
      conversionRate:
        newLeads > 0 ? Math.round((convertedLeads / newLeads) * 1000) / 10 : 0,
      proposalsCreated,
      contractsSigned,
      totalContractValue: totalContractValue._sum.totalValue || 0,
      averageContractValue:
        contractsSigned > 0
          ? Math.round(
              ((totalContractValue._sum.totalValue || 0) / contractsSigned) *
                100,
            ) / 100
          : 0,
      leadsBySource: leadsBySource.reduce(
        (acc, r) => {
          acc[r.source] = r._count.source;
          return acc;
        },
        {} as Record<string, number>,
      ),
      conversionByStage: conversionByStage.reduce(
        (acc, r) => {
          acc[r.status] = r._count.status;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async getActivity(limit: number) {
    const [recentLeads, recentProposals, recentContracts] = await Promise.all([
      this.prisma.request.findMany({
        select: {
          id: true,
          companyName: true,
          status: true,
          createdAt: true,
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      this.prisma.proposal.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          request: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: "desc" },
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
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const activities = [
      ...recentLeads.map((l) => ({
        type: "request" as const,
        id: l.id,
        title: l.companyName,
        detail: l.status,
        createdAt: l.createdAt,
        assignee: l.assignee?.name,
      })),
      ...recentProposals.map((p) => ({
        type: "proposal" as const,
        id: p.id,
        title: p.title,
        detail: p.status,
        createdAt: p.createdAt,
        client: p.request?.companyName,
      })),
      ...recentContracts.map((c) => ({
        type: "contract" as const,
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
