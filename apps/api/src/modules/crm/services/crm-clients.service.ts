import { Injectable, NotFoundException } from "@nestjs/common";

import { RequestStatus } from "@hassad/shared";
import { PrismaService } from "../../../prisma/prisma.service";

import { CrmClientsWorkspaceQueryDto } from "../dto/crm-clients.dto";

@Injectable()
export class CrmClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspace(query: CrmClientsWorkspaceQueryDto) {
    const search = query.search?.trim();
    const where = search
      ? {
          OR: [
            { companyName: { contains: search, mode: "insensitive" as const } },
            {
              businessName: { contains: search, mode: "insensitive" as const },
            },
            {
              user: {
                is: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
            },
            {
              user: {
                is: {
                  email: { contains: search, mode: "insensitive" as const },
                },
              },
            },
            {
              user: {
                is: {
                  phoneWhatsapp: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            { id: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const clients = await this.prisma.client.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneWhatsapp: true,
            lastLoginAt: true,
          },
        },
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
    });

    const clientRows = clients.map((client) => ({
      id: client.id,
      kind: client.kind,
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
        client.status === "SUSPENDED"
          ? ("warning" as const)
          : client.activeProjects > 0
            ? ("active" as const)
            : ("neutral" as const),
      financeTone:
        (client.totalContractValue ?? 0) > (client.totalPaid ?? 0)
          ? ("warning" as const)
          : ("success" as const),
    }));

    const combined =
      query.filter === "clients"
        ? clientRows.filter((client) => client.kind === "CLIENT")
        : query.filter === "leads"
          ? clientRows.filter((client) => client.kind === "LEAD")
          : clientRows;

    combined.sort((left, right) =>
      query.sort === "lowest-spend"
        ? left.totalSpend - right.totalSpend
        : right.totalSpend - left.totalSpend,
    );

    return { items: combined };
  }

  async getFull(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneWhatsapp: true,
            avatarUrl: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        profile: true,
        requests: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { source: true },
        },
        _count: {
          select: {
            contracts: true,
            projects: true,
            invoices: true,
            payments: true,
            proposals: true,
            requests: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException({
        code: "CLIENT_NOT_FOUND",
        details: { clientId },
      });
    }

    const [
      contracts,
      projects,
      invoices,
      payments,
      historyLogs,
      ratings,
      avgResult,
      overdueInvoicesCount,
      disputes,
    ] = await Promise.all([
      this.prisma.contract.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          totalValue: true,
          monthlyValue: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          type: true,
          currency: true,
          _count: { select: { invoices: true } },
        },
      }),
      this.prisma.project.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          status: true,
          completionPercentage: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          manager: { select: { id: true, name: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          issueDate: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
          payments: {
            select: { id: true, amount: true, status: true, createdAt: true },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
          invoice: { select: { id: true, invoiceNumber: true } },
        },
      }),
      this.prisma.clientHistoryLog.findMany({
        where: { clientId },
        orderBy: { occurredAt: "desc" },
        take: 20,
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.satisfactionRating.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.satisfactionRating.aggregate({
        where: { clientId },
        _avg: { score: true },
      }),
      this.prisma.invoice.count({
        where: { clientId, status: { in: ["SENT", "DUE", "LATE", "PARTIAL"] } },
      }),
      this.prisma.disputeTicket.findMany({
        where: { clientId },
        orderBy: { openedAt: "desc" },
        take: 20,
        include: {
          pm: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      ...client,
      source: client.requests[0]?.source ?? null,
      portalToken: client.portalAccessToken,
      portalTokenExpiresAt: client.portalTokenExpiresAt?.toISOString() ?? null,
      managerName: client.manager?.name ?? null,
      hasPortalAccess: !!client.portalAccessToken,
      overdueInvoicesCount,
      contracts: contracts.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        totalValue: c.totalValue,
        monthlyValue: c.monthlyValue,
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        type: c.type,
        currency: c.currency,
        invoiceCount: c._count.invoices,
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        completionPercentage: p.completionPercentage,
        pmName: p.manager?.name ?? null,
        pmId: p.manager?.id ?? null,
        startDate: p.startDate?.toISOString() ?? null,
        endDate: p.endDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        remainingAmount:
          inv.amount -
          inv.payments
            .filter((payment) => payment.status === "SUCCESS")
            .reduce((sum, payment) => sum + payment.amount, 0),
        status: inv.status,
        issueDate: inv.issueDate?.toISOString() ?? null,
        dueDate: inv.dueDate?.toISOString() ?? null,
        paidAt: inv.paidAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
        payments: inv.payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt.toISOString(),
        })),
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt.toISOString(),
        invoice: payment.invoice,
      })),
      historyLogs: historyLogs.map((log) => ({
        id: log.id,
        eventType: log.eventType,
        description: log.description,
        occurredAt: log.occurredAt.toISOString(),
        userName: log.user?.name ?? null,
      })),
      disputes: disputes.map((dispute) => ({
        title: dispute.title,
        relatedTo: dispute.project?.name ?? dispute.ticketNumber,
        status: dispute.status,
        priority: dispute.priority,
        openedAt: dispute.openedAt.toISOString(),
        owner: dispute.pm?.name ?? "Unassigned",
        blocker: dispute.description,
      })),
      counters: {
        payments: client._count.payments,
        proposals: client._count.proposals,
        requests: client._count.requests,
      },
      avgSatisfactionScore: avgResult._avg.score ?? null,
      ratings: ratings.map((rating) => ({
        id: rating.id,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt.toISOString(),
      })),
    };
  }
}
