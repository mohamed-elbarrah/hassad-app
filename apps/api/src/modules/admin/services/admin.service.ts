import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ContractStatus } from "@prisma/client";
import { AdminKpiService } from "./admin-kpi.service";
import { AiService } from "../../ai/services/ai.service";

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private adminKpiService: AdminKpiService,
    private aiService: AiService,
  ) {}

  private parseDateRange(from?: string, to?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (!from && !to) {
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );
      return {
        startOfMonth,
        startOfLastMonth,
        endOfLastMonth,
        periodEnd: now,
        isCustom: false,
      };
    }

    const periodStart = from ? new Date(from) : startOfMonth;
    const periodEnd = to ? new Date(to) : now;

    // Previous period of same length
    const durationMs = periodEnd.getTime() - periodStart.getTime();
    const prevPeriodStart = new Date(periodStart.getTime() - durationMs);
    const prevPeriodEnd = new Date(periodStart.getTime() - 1);

    return {
      startOfMonth: periodStart,
      startOfLastMonth: prevPeriodStart,
      endOfLastMonth: prevPeriodEnd,
      periodEnd,
      isCustom: true,
    };
  }

  async getStats(from?: string, to?: string) {
    const { startOfMonth, startOfLastMonth, endOfLastMonth, periodEnd } =
      this.parseDateRange(from, to);
    const now = new Date();

    const [
      totalUsers,
      activeClients,
      newClientsThisMonth,
      activeProjects,
      completedProjects,
      overdueTasks,
      totalTasks,
      monthlyRevenue,
      lastMonthRevenue,
      unpaidInvoicesCount,
      totalInvoices,
      employeesCount,
      pendingRequests,
      activeCampaigns,
      conversationsCount,
      recentUsers,
      usersByRole,
      satisfactionResult,
      // Previous period values for delta
      prevNewClients,
      prevActiveProjects,
      prevCompletedProjects,
      prevTasksTotal,
      prevOverdueTasks,
      prevUnpaidInvoices,
      prevTotalInvoices,
      prevPendingRequests,
      // Retention & churn
      clientKpis,
      prevClientKpis,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: { name: { not: "CLIENT" } } },
      }),
      this.prisma.client.count({ where: { status: "ACTIVE" } }),
      this.prisma.client.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.project.count({
        where: { status: { in: ["ACTIVE", "PLANNING"] } },
      }),
      this.prisma.project.count({
        where: { status: "COMPLETED" },
      }),
      this.prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: ["DONE", "REVISION"] },
        },
      }),
      this.prisma.task.count(),
      this.prisma.invoice.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startOfMonth, lte: periodEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.count({
        where: { status: { in: ["DUE", "SENT", "LATE", "PARTIAL"] } },
      }),
      this.prisma.invoice.count(),
      this.prisma.employee.count({ where: { isActive: true } }),
      this.prisma.request.count({
        where: { status: { in: ["SUBMITTED", "QUALIFYING"] } },
      }),
      this.prisma.campaign.count({
        where: { status: { in: ["ACTIVE", "PLANNING"] } },
      }),
      this.prisma.conversation.count({
        where: { isActive: true },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.role.findMany({
        select: {
          name: true,
          _count: { select: { users: true } },
        },
      }),
      this.prisma.satisfactionRating.aggregate({
        _avg: { score: true },
      }),
      // Previous period queries
      this.prisma.client.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      this.prisma.project.count({
        where: {
          status: { in: ["ACTIVE", "PLANNING"] },
          createdAt: { lte: endOfLastMonth },
        },
      }),
      // completedProjects delta — no completion date field, set null in response
      0,
      this.prisma.task.count({
        where: { createdAt: { lte: endOfLastMonth } },
      }),
      this.prisma.task.count({
        where: {
          dueDate: { lt: endOfLastMonth },
          status: { notIn: ["DONE", "REVISION"] },
        },
      }),
      this.prisma.invoice.count({
        where: {
          status: { in: ["DUE", "SENT", "LATE", "PARTIAL"] },
          createdAt: { lte: endOfLastMonth },
        },
      }),
      this.prisma.invoice.count({
        where: { createdAt: { lte: endOfLastMonth } },
      }),
      this.prisma.request.count({
        where: {
          status: { in: ["SUBMITTED", "QUALIFYING"] },
          createdAt: { lte: endOfLastMonth },
        },
      }),
      // Retention & churn for current period
      this.adminKpiService.getClientKpis(from, to),
      // Retention & churn for previous period
      this.adminKpiService.getClientKpis(
        startOfLastMonth.toISOString(),
        endOfLastMonth.toISOString(),
      ),
    ]);

    const lastMonthRev = Number(lastMonthRevenue._sum.amount ?? 0);
    const thisMonthRev = Number(monthlyRevenue._sum.amount ?? 0);
    const revenueChange =
      lastMonthRev > 0
        ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
        : 0;

    const computeDelta = (current: number, previous: number): number | null => {
      if (previous === 0 && current === 0) return null;
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalUsers,
      recentUsers,
      usersByRole: usersByRole.map((r) => ({
        role: r.name,
        count: r._count.users,
      })),
      activeClients,
      newClientsThisMonth,
      activeProjects,
      completedProjects,
      totalTasks,
      overdueTasks,
      monthlyRevenue: thisMonthRev,
      revenueChange,
      unpaidInvoicesCount,
      totalInvoices,
      employeesCount,
      pendingRequests,
      activeCampaigns,
      conversationsCount,
      satisfactionRate: satisfactionResult._avg.score
        ? Math.round(satisfactionResult._avg.score * 20)
        : null,
      retentionRate: Math.round(clientKpis.retentionRate * 10) / 10,
      churnRate: Math.round(clientKpis.churnRate * 10) / 10,
      deltas: {
        totalUsers: null,
        activeClients: null,
        newClientsThisMonth: computeDelta(newClientsThisMonth, prevNewClients),
        activeProjects: computeDelta(activeProjects, prevActiveProjects),
        completedProjects: null, // No completion date field available
        totalTasks: computeDelta(totalTasks, prevTasksTotal),
        overdueTasks: computeDelta(overdueTasks, prevOverdueTasks),
        monthlyRevenue: revenueChange,
        unpaidInvoicesCount: computeDelta(
          unpaidInvoicesCount,
          prevUnpaidInvoices,
        ),
        totalInvoices: computeDelta(totalInvoices, prevTotalInvoices),
        pendingRequests: computeDelta(pendingRequests, prevPendingRequests),
        retentionRate:
          prevClientKpis.retentionRate > 0
            ? Math.round(
                (clientKpis.retentionRate - prevClientKpis.retentionRate) * 10,
              ) / 10
            : null,
        churnRate:
          prevClientKpis.churnRate > 0 || clientKpis.churnRate > 0
            ? Math.round(
                (clientKpis.churnRate - prevClientKpis.churnRate) * 10,
              ) / 10
            : null,
      },
    };
  }

  async getTrends(from?: string, to?: string, days = 30) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let numDays: number;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
      numDays =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
        ) + 1;
    } else {
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      endDate = now;
      numDays = days;
    }

    const labels: string[] = [];
    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      if (d > endDate) break;
      labels.push(d.toISOString().slice(0, 10));
    }

    const [paidInvoices, newUsers, newClients, newProjects, completedTasks] =
      await Promise.all([
        this.prisma.invoice.findMany({
          where: { status: "PAID", paidAt: { gte: startDate } },
          select: { amount: true, paidAt: true },
        }),
        this.prisma.user.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true },
        }),
        this.prisma.client.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true },
        }),
        this.prisma.project.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true },
        }),
        this.prisma.task.findMany({
          where: { status: "DONE", approvedAt: { gte: startDate } },
          select: { approvedAt: true },
        }),
      ]);

    const revenue: number[] = [];
    const newUsersArr: number[] = [];
    const newClientsArr: number[] = [];
    const newProjectsArr: number[] = [];
    const tasksCompletedArr: number[] = [];

    for (const label of labels) {
      const dayStart = new Date(label + "T00:00:00.000Z");
      const dayEnd = new Date(label + "T23:59:59.999Z");

      revenue.push(
        paidInvoices
          .filter(
            (inv) =>
              inv.paidAt && inv.paidAt >= dayStart && inv.paidAt <= dayEnd,
          )
          .reduce((sum, inv) => sum + Number(inv.amount), 0),
      );
      newUsersArr.push(
        newUsers.filter((u) => u.createdAt >= dayStart && u.createdAt <= dayEnd)
          .length,
      );
      newClientsArr.push(
        newClients.filter(
          (c) => c.createdAt >= dayStart && c.createdAt <= dayEnd,
        ).length,
      );
      newProjectsArr.push(
        newProjects.filter(
          (p) => p.createdAt >= dayStart && p.createdAt <= dayEnd,
        ).length,
      );
      tasksCompletedArr.push(
        completedTasks.filter(
          (t) =>
            t.approvedAt && t.approvedAt >= dayStart && t.approvedAt <= dayEnd,
        ).length,
      );
    }

    return {
      revenue,
      newUsers: newUsersArr,
      newClients: newClientsArr,
      newProjects: newProjectsArr,
      tasksCompleted: tasksCompletedArr,
      labels,
    };
  }

  async getFunnel(from?: string, to?: string) {
    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const excludedStatuses: ContractStatus[] = [
      ContractStatus.CANCELLED,
      ContractStatus.DRAFT,
    ];
    const contractDateFilter =
      from || to
        ? { ...dateFilter, status: { notIn: excludedStatuses } }
        : { status: { notIn: excludedStatuses } };

    const [
      leads,
      clients,
      proposals,
      contracts,
      projects,
      invoices,
      payments,
      contractStatusDistribution,
    ] = await Promise.all([
      this.prisma.request.count({ where: dateFilter }),
      this.prisma.client.count({
        where: { status: { not: "SUSPENDED" }, ...dateFilter },
      }),
      this.prisma.proposal.count({ where: dateFilter }),
      this.prisma.contract.count({ where: contractDateFilter }),
      this.prisma.project.count({
        where: { isArchived: false, ...dateFilter },
      }),
      this.prisma.invoice.count({ where: dateFilter }),
      this.prisma.payment.count({
        where: { status: "SUCCESS", ...dateFilter },
      }),
      // Contract status distribution — respects date range if provided
      this.prisma.contract.groupBy({
        by: ["status"],
        where:
          from || to
            ? contractDateFilter
            : { status: { notIn: excludedStatuses } },
        _count: { id: true },
      }),
    ]);

    const calcRate = (from: number, to: number) =>
      from > 0 ? Math.round((to / from) * 100 * 10) / 10 : 0;

    const statusDist: Record<string, number> = {};
    for (const s of contractStatusDistribution) {
      statusDist[s.status] = s._count.id;
    }

    return {
      leads,
      clients,
      proposals,
      contracts,
      projects,
      invoices,
      payments,
      conversionRates: {
        leadsToClients: calcRate(leads, clients),
        clientsToProposals: calcRate(clients, proposals),
        proposalsToContracts: calcRate(proposals, contracts),
        contractsToProjects: calcRate(contracts, projects),
        projectsToInvoices: calcRate(projects, invoices),
        invoicesToPayments: calcRate(invoices, payments),
      },
      contractStatusDistribution: statusDist,
    };
  }

  async getAlerts() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    const [
      overdueTasks,
      agedInvoices,
      escalatedDisputes,
      failedWebhooks,
      expiringContracts,
      pendingRequests,
      overdueTaskItems,
      agedInvoiceItems,
      escalatedDisputeItems,
      pendingRequestItems,
      expiringContractItems,
    ] = await Promise.all([
      this.prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: ["DONE", "REVISION"] },
        },
      }),
      this.prisma.invoice.count({
        where: {
          status: { in: ["DUE", "SENT", "LATE", "PARTIAL"] },
          dueDate: { lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.disputeTicket.count({ where: { status: "ESCALATED" } }),
      this.prisma.webhookLog.count({ where: { processed: false } }),
      this.prisma.contract.count({
        where: {
          status: "ACTIVE",
          endDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
      this.prisma.request.count({
        where: { status: { in: ["SUBMITTED", "QUALIFYING"] } },
      }),
      this.prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { notIn: ["DONE", "REVISION"] },
        },
        take: 5,
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          title: true,
          dueDate: true,
          assignedTo: true,
          assignee: { select: { name: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          status: { in: ["DUE", "SENT", "LATE", "PARTIAL"] },
          dueDate: { lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
        },
        take: 5,
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          dueDate: true,
          client: { select: { companyName: true } },
        },
      }),
      this.prisma.disputeTicket.findMany({
        where: { status: "ESCALATED" },
        take: 5,
        orderBy: { escalatedAt: "desc" },
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          priority: true,
          escalatedAt: true,
        },
      }),
      this.prisma.request.findMany({
        where: { status: { in: ["SUBMITTED", "QUALIFYING"] } },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          companyName: true,
          createdAt: true,
          contactName: true,
        },
      }),
      this.prisma.contract.findMany({
        where: {
          status: "ACTIVE",
          endDate: { gte: now, lte: thirtyDaysFromNow },
        },
        take: 5,
        orderBy: { endDate: "asc" },
        select: {
          id: true,
          title: true,
          endDate: true,
          client: { select: { companyName: true } },
        },
      }),
    ]);

    return {
      overdueTasks: {
        count: overdueTasks,
        label: "مهام متأخرة",
        link: "/dashboard/admin/tasks?status=OVERDUE",
        items: overdueTaskItems.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate?.toISOString() ?? null,
          assignee: t.assignee?.name ?? null,
        })),
      },
      agedInvoices: {
        count: agedInvoices,
        label: "فواتير غير مسددة (+60 يوم)",
        link: "/dashboard/admin/finance/invoices?aging=60",
        items: agedInvoiceItems.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.amount,
          dueDate: inv.dueDate?.toISOString() ?? null,
          clientName: inv.client?.companyName ?? null,
        })),
      },
      escalatedDisputes: {
        count: escalatedDisputes,
        label: "نزاعات تم تصعيدها",
        link: "/dashboard/admin/disputes?status=ESCALATED",
        items: escalatedDisputeItems.map((d) => ({
          id: d.id,
          ticketNumber: d.ticketNumber,
          title: d.title,
          priority: d.priority,
        })),
      },
      failedWebhooks: {
        count: failedWebhooks,
        label: "Webhooks فاشلة",
        link: "/dashboard/admin/integrations?status=failed",
        items: [],
      },
      expiringContracts: {
        count: expiringContracts,
        label: "عقود تنتهي قريباً",
        link: "/dashboard/admin/contracts?expiring=30",
        items: expiringContractItems.map((c) => ({
          id: c.id,
          title: c.title,
          endDate: c.endDate?.toISOString() ?? null,
          clientName: c.client?.companyName ?? null,
        })),
      },
      pendingRequests: {
        count: pendingRequests,
        label: "طلبات معلقة",
        link: "/dashboard/admin/requests?status=PENDING",
        items: pendingRequestItems.map((r) => ({
          id: r.id,
          companyName: r.companyName,
          contactName: r.contactName,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    };
  }

  async getRecentActivity() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      clientHistory,
      taskHistory,
      contractHistory,
      disputeHistory,
      requestHistory,
    ] = await Promise.all([
      this.prisma.clientHistoryLog.findMany({
        where: { occurredAt: { gte: sevenDaysAgo } },
        take: 10,
        orderBy: { occurredAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
      this.prisma.taskStatusHistory.findMany({
        where: { changedAt: { gte: sevenDaysAgo } },
        take: 10,
        orderBy: { changedAt: "desc" },
        include: { changer: { select: { name: true } } },
      }),
      this.prisma.contractStatusHistory.findMany({
        where: { changedAt: { gte: sevenDaysAgo } },
        take: 10,
        orderBy: { changedAt: "desc" },
        include: { changedByUser: { select: { name: true } } },
      }),
      this.prisma.disputeHistory.findMany({
        where: { changedAt: { gte: sevenDaysAgo } },
        take: 10,
        orderBy: { changedAt: "desc" },
        include: { changer: { select: { name: true } } },
      }),
      this.prisma.requestStatusHistory.findMany({
        where: { changedAt: { gte: sevenDaysAgo } },
        take: 10,
        orderBy: { changedAt: "desc" },
        include: { changer: { select: { name: true } } },
      }),
    ]);

    const entries: Array<{
      id: string;
      entityType: string;
      eventType: string;
      description: string;
      occurredAt: string;
      actorName: string | null;
    }> = [];

    for (const h of clientHistory) {
      entries.push({
        id: h.id,
        entityType: "client",
        eventType: h.eventType,
        description: h.description,
        occurredAt: h.occurredAt.toISOString(),
        actorName: h.user?.name ?? null,
      });
    }
    for (const h of taskHistory) {
      entries.push({
        id: h.id,
        entityType: "task",
        eventType: `TASK_${h.toStatus}`,
        description: `تغيير حالة المهمة من ${h.fromStatus ?? "—"} إلى ${h.toStatus}`,
        occurredAt: h.changedAt.toISOString(),
        actorName: h.changer?.name ?? null,
      });
    }
    for (const h of contractHistory) {
      entries.push({
        id: h.id,
        entityType: "contract",
        eventType: `CONTRACT_${h.toStatus}`,
        description: h.reason
          ? `تغيير حالة العقد: ${h.reason}`
          : `تغيير حالة العقد من ${h.fromStatus ?? "—"} إلى ${h.toStatus}`,
        occurredAt: h.changedAt.toISOString(),
        actorName: h.changedByUser?.name ?? null,
      });
    }
    for (const h of disputeHistory) {
      entries.push({
        id: h.id,
        entityType: "dispute",
        eventType: `DISPUTE_${h.toStatus}`,
        description: h.note ?? `تغيير حالة النزاع إلى ${h.toStatus}`,
        occurredAt: h.changedAt.toISOString(),
        actorName: h.changer?.name ?? null,
      });
    }
    for (const h of requestHistory) {
      entries.push({
        id: h.id,
        entityType: "request",
        eventType: `REQUEST_${h.toStatus}`,
        description: h.note ?? `تغيير حالة الطلب إلى ${h.toStatus}`,
        occurredAt: h.changedAt.toISOString(),
        actorName: h.changer?.name ?? null,
      });
    }

    entries.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
    return entries.slice(0, 15);
  }

  async getHealth() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [dbTest, errorCount, activeUsers, pendingWebhooks] =
      await Promise.all([
        this.prisma
          .$queryRawUnsafe<[{ "1": number }]>(`SELECT 1`)
          .catch(() => [{ 1: 0 }]),
        this.prisma.webhookLog.count({
          where: { processed: false, createdAt: { gte: oneHourAgo } },
        }),
        this.prisma.ledger.groupBy({
          by: ["userId"],
          where: { createdAt: { gte: oneHourAgo } },
        }),
        this.prisma.webhookLog.count({ where: { processed: false } }),
      ]);

    return {
      status: dbTest?.[0]?.["1"] === 1 ? "healthy" : "degraded",
      database: dbTest?.[0]?.["1"] === 1 ? "connected" : "disconnected",
      recentErrors: errorCount,
      activeUsersLastHour: activeUsers.length,
      pendingWebhooks,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: now.toISOString(),
    };
  }

  async getAiInsights() {
    const [recentAnalyses, pendingSuggestions] = await Promise.all([
      this.prisma.aiAnalysisLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
      this.prisma.aiSuggestion.count({
        where: { status: "PENDING" },
      }),
    ]);

    return {
      recentAnalyses: recentAnalyses.map((log) => ({
        id: log.id,
        entityType: log.entityType,
        entityId: log.entityId,
        analysisType: log.analysisType,
        summary: (log.outputData as any)?.summary ?? "",
        score: (log.outputData as any)?.score ?? null,
        recommendations: (log.outputData as any)?.recommendations ?? [],
        triggeredBy: log.user?.name ?? null,
        createdAt: log.createdAt.toISOString(),
      })),
      pendingSuggestions,
    };
  }

  async runAiScan(userId: string) {
    const SYSTEM_USER_ID = userId;

    const [requests, clients, projects, tasks] = await Promise.all([
      this.prisma.request.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.client.findMany({
        where: { status: "ACTIVE" },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.project.findMany({
        where: { status: { not: "COMPLETED" } },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.task.findMany({
        where: { status: { not: "DONE" } },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const allJobs: Array<{
      entityType: string;
      entityId: string;
      analysisType: string;
    }> = [
      ...requests.map((r) => ({
        entityType: "REQUEST",
        entityId: r.id,
        analysisType: "SENTIMENT_ANALYSIS",
      })),
      ...clients.map((c) => ({
        entityType: "CLIENT",
        entityId: c.id,
        analysisType: "CHURN_PREDICTION",
      })),
      ...projects.map((p) => ({
        entityType: "PROJECT",
        entityId: p.id,
        analysisType: "QUALITY_CHECK",
      })),
      ...tasks.map((t) => ({
        entityType: "TASK",
        entityId: t.id,
        analysisType: "QUALITY_CHECK",
      })),
    ];

    let analyzed = 0;
    let failed = 0;

    for (const job of allJobs) {
      try {
        await this.aiService.analyze(SYSTEM_USER_ID, job as any);
        analyzed++;
      } catch {
        failed++;
      }
    }

    return { analyzed, failed };
  }
}
