import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClientStatus,
  ContractStatus,
  PipelineStage,
  ProposalStatus,
  UserRole,
} from "@hassad/shared";
import type { JwtPayload } from "../common/decorators/current-user.decorator";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(user: JwtPayload) {
    const clientScope: Prisma.ClientWhereInput = {};

    if (user.role === UserRole.SALES) {
      clientScope.assignedToId = user.id;
    }

    const [
      totalLeads,
      activeClients,
      stoppedClients,
      meetingsScheduled,
      signedContracts,
      proposalCount,
      stageCounts,
    ] = await Promise.all([
      this.prisma.client.count({
        where: { ...clientScope, status: ClientStatus.LEAD },
      }),
      this.prisma.client.count({
        where: { ...clientScope, status: ClientStatus.ACTIVE },
      }),
      this.prisma.client.count({
        where: { ...clientScope, status: ClientStatus.STOPPED },
      }),
      this.prisma.client.count({
        where: {
          ...clientScope,
          stage: {
            in: [PipelineStage.MEETING_SCHEDULED, PipelineStage.MEETING_HELD],
          },
        },
      }),
      this.prisma.contract.count({
        where: {
          status: ContractStatus.SIGNED,
          ...(user.role === UserRole.SALES
            ? { client: { assignedToId: user.id } }
            : {}),
        },
      }),
      this.prisma.proposal.count({
        where: {
          status: { in: [ProposalStatus.SENT, ProposalStatus.APPROVED] },
          ...(user.role === UserRole.SALES
            ? { client: { assignedToId: user.id } }
            : {}),
        },
      }),
      this.prisma.client.groupBy({
        by: ["stage"],
        _count: { _all: true },
        where: clientScope,
      }),
    ]);

    const closeRate = totalLeads > 0 ? signedContracts / totalLeads : 0;

    const stageBreakdown = stageCounts.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.stage] = row._count._all;
        return acc;
      },
      {},
    );

    return {
      totals: {
        totalLeads,
        activeClients,
        stoppedClients,
      },
      meetingsScheduled,
      proposalsSent: proposalCount,
      signedContracts,
      closeRate,
      stageBreakdown,
    };
  }
}
