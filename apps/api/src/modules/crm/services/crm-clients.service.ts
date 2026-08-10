import { Injectable } from "@nestjs/common";

import { RequestStatus } from "@hassad/shared";
import { PrismaService } from "../../../prisma/prisma.service";

import { CrmClientsWorkspaceQueryDto } from "../dto/crm-clients.dto";

@Injectable()
export class CrmClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspace(query: CrmClientsWorkspaceQueryDto) {
    const [clients, leads] = await Promise.all([
      this.prisma.client.findMany({
        include: {
          user: { select: { name: true, lastLoginAt: true } },
          requests: {
            where: {
              status: {
                in: [
                  RequestStatus.SUBMITTED,
                  RequestStatus.QUALIFYING,
                  RequestStatus.PROPOSAL_IN_PROGRESS,
                  RequestStatus.PROPOSAL_SENT,
                  RequestStatus.NEGOTIATION,
                  RequestStatus.CONTRACT_PREPARATION,
                  RequestStatus.CONTRACT_SENT,
                ],
              },
            },
            select: { id: true },
          },
          _count: {
            select: { projects: true, contracts: true, proposals: true },
          },
        },
      }),
      this.prisma.lead.findMany({
        where: { isActive: true, client: { is: null } },
        include: {
          assignee: { select: { name: true } },
          proposals: { select: { id: true } },
        },
      }),
    ]);

    const clientRows = clients.map((client) => ({
      id: client.id,
      contactName: client.user?.name ?? client.companyName,
      companyName: client.companyName ?? client.businessName ?? "—",
      stage:
        client.activeProjects > 0
          ? ("active" as const)
          : client.completedProjects > 0
            ? ("completed" as const)
            : ("active" as const),
      totalProjects: client.totalProjects ?? client._count.projects,
      activeProjects: client.activeProjects ?? 0,
      openOrders: client.requests.length,
      pendingOffers: client._count.proposals,
      signedContracts: client._count.contracts,
      totalSpend: client.totalPaid ?? 0,
      outstandingAmount: Math.max(
        Number(client.totalContractValue ?? 0) - Number(client.totalPaid ?? 0),
        0,
      ),
      lastSeen: client.user?.lastLoginAt
        ? new Date(client.user.lastLoginAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No portal session",
      stageTone:
        client.status === "STOPPED"
          ? ("warning" as const)
          : client.activeProjects > 0
            ? ("active" as const)
            : ("neutral" as const),
      financeTone:
        (client.totalContractValue ?? 0) > (client.totalPaid ?? 0)
          ? ("warning" as const)
          : ("success" as const),
    }));

    const leadRows = leads.map((lead) => ({
      id: lead.id,
      contactName: lead.contactName,
      companyName: lead.companyName,
      stage: "lead" as const,
      totalProjects: 0,
      activeProjects: 0,
      openOrders: 1,
      pendingOffers: lead.proposals.length,
      signedContracts: 0,
      totalSpend: 0,
      outstandingAmount: 0,
      lastSeen: lead.lastContactAt
        ? new Date(lead.lastContactAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No contact yet",
      stageTone: "attention" as const,
      financeTone: "neutral" as const,
    }));

    const combined =
      query.filter === "clients"
        ? clientRows
        : query.filter === "leads"
          ? leadRows
          : [...clientRows, ...leadRows];

    combined.sort((left, right) =>
      query.sort === "lowest-spend"
        ? left.totalSpend - right.totalSpend
        : right.totalSpend - left.totalSpend,
    );

    return { items: combined };
  }
}
