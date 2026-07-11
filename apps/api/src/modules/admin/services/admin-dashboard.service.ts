import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttention() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [stalledProjects, newRequests, openDisputes, overdueInvoices, unacknowledgedAlerts] =
      await Promise.all([
        // Stalled: PLANNING/PENDING_ACTIVATION for >7d, or no update in 14d
        this.prisma.project.findMany({
          where: {
            isArchived: false,
            OR: [
              {
                status: { in: ["PLANNING", "PENDING_ACTIVATION"] },
                createdAt: { lt: sevenDaysAgo },
              },
              {
                status: { notIn: ["COMPLETED", "CANCELLED"] },
                updatedAt: { lt: fourteenDaysAgo },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            client: { select: { id: true, companyName: true } },
          },
          orderBy: { updatedAt: "asc" },
          take: 20,
        }),

        // New requests: SUBMITTED, no assignment
        this.prisma.request.findMany({
          where: { status: "SUBMITTED", assignedSalesId: null },
          select: {
            id: true,
            companyName: true,
            contactName: true,
            status: true,
            createdAt: true,
            client: { select: { id: true, companyName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),

        // Open disputes: not in terminal states, escalated first
        this.prisma.disputeTicket.findMany({
          where: {
            status: {
              notIn: ["REJECTED", "RESOLVED", "CLOSED"],
            },
          },
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            status: true,
            escalatedAt: true,
            openedAt: true,
            client: { select: { id: true, companyName: true } },
          },
          orderBy: [{ escalatedAt: { sort: "desc", nulls: "last" } }, { openedAt: "desc" }],
          take: 20,
        }),

        // Overdue invoices
        this.prisma.invoice.findMany({
          where: {
            dueDate: { lt: now },
            status: { notIn: ["PAID", "CANCELLED"] },
          },
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            dueDate: true,
            client: { select: { id: true, companyName: true } },
          },
          orderBy: { dueDate: "asc" },
          take: 20,
        }),

        // Unacknowledged delay alerts
        this.prisma.taskDelayAlert.findMany({
          where: { isAcknowledged: false },
          select: {
            id: true,
            alertLevel: true,
            triggeredAt: true,
            task: { select: { id: true, title: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: { triggeredAt: "desc" },
          take: 20,
        }),
      ]);

    return {
      stalledProjects,
      newRequests,
      openDisputes,
      overdueInvoices,
      unacknowledgedAlerts,
    };
  }

  async getRecentActivity(limit?: number) {
    const take = limit ?? 20;
    const entries = await this.prisma.ledger.findMany({
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return entries.map((e) => ({
      id: e.id,
      action: e.action,
      entity: e.entity,
      entityId: e.entityId,
      userId: e.userId,
      userName: e.user?.name ?? null,
      userEmail: e.user?.email ?? null,
      before: e.before,
      after: e.after,
      metadata: e.metadata,
      createdAt: e.createdAt,
    }));
  }

  async getTeamWorkload() {
    const workloads = await this.prisma.staffWorkload.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const countByStatus: Record<string, number> = {};
    for (const w of workloads) {
      countByStatus[w.workloadStatus] = (countByStatus[w.workloadStatus] || 0) + 1;
    }

    return {
      summary: {
        total: workloads.length,
        byStatus: Object.entries(countByStatus).map(([status, count]) => ({ status, count })),
      },
      members: workloads.map((w) => ({
        userId: w.userId,
        userName: w.user?.name ?? null,
        userEmail: w.user?.email ?? null,
        activeTasksCount: w.activeTasksCount,
        workloadStatus: w.workloadStatus,
        avgCompletionSpeedDays: w.avgCompletionSpeedDays,
        avgQualityScore: w.avgQualityScore,
      })),
    };
  }
}
