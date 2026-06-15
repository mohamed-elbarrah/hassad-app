import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ClientCounterService {
  private readonly logger = new Logger(ClientCounterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recomputeAll(clientId: string): Promise<void> {
    const [
      projectStats,
      contractStats,
      invoiceStats,
      satisfactionStats,
      lastProject,
    ] = await Promise.all([
      this.prisma.project.groupBy({
        by: ["status"],
        where: { clientId, isArchived: false },
        _count: true,
      }),
      this.prisma.contract.aggregate({
        where: { clientId, status: { in: ["SIGNED", "ACTIVE"] } },
        _sum: { totalValue: true },
      }),
      this.prisma.invoice.aggregate({
        where: { clientId, status: { in: ["PAID", "PARTIAL"] } },
        _sum: { amount: true },
      }),
      this.prisma.satisfactionRating.aggregate({
        where: { clientId },
        _avg: { score: true },
      }),
      this.prisma.project.findFirst({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        totalProjects: projectStats.reduce((sum, g) => sum + g._count, 0),
        activeProjects:
          projectStats.find((g) => g.status === "ACTIVE")?._count ?? 0,
        completedProjects:
          projectStats.find((g) => g.status === "COMPLETED")?._count ?? 0,
        cancelledProjects:
          projectStats.find((g) => g.status === "CANCELLED")?._count ?? 0,
        totalContractValue: contractStats._sum.totalValue ?? 0,
        totalInvoiced: invoiceStats._sum.amount ?? 0,
        totalPaid: invoiceStats._sum.amount ?? 0,
        lastProjectAt: lastProject?.createdAt ?? null,
        avgSatisfactionScore: satisfactionStats._avg.score ?? null,
      },
    });

    await this.prisma.clientHistoryLog.create({
      data: {
        clientId,
        userId: "system",
        eventType: "CLIENT_COUNTERS_UPDATED",
        description: "Client counters recomputed",
      },
    });

    this.logger.log(`Recomputed counters for client ${clientId}`);
  }

  async onProjectStatusChange(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    if (project) {
      await this.recomputeAll(project.clientId);
    }
  }

  async onInvoicePaid(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { clientId: true },
    });
    if (invoice) {
      await this.recomputeAll(invoice.clientId);
    }
  }

  async onSatisfactionRated(clientId: string): Promise<void> {
    await this.recomputeAll(clientId);
  }

  async onContractSigned(contractId: string): Promise<void> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { clientId: true },
    });
    if (contract) {
      await this.recomputeAll(contract.clientId);
    }
  }
}
