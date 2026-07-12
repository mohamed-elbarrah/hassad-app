import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminKpiService } from "./admin-kpi.service";
import { AdminActionLogService } from "./admin-action-log.service";
import { ReportPeriod } from "@prisma/client";

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiService: AdminKpiService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  private dateWhere(from?: string, to?: string) {
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    return where;
  }

  async getSalesReport(from?: string, to?: string) {
    const dateFilter = this.dateWhere(from, to);

    const [totalLeads, leadsByStage, leadsBySource, signedLeads] = await Promise.all([
      this.prisma.lead.count({ where: dateFilter }),
      this.prisma.lead.groupBy({
        by: ["pipelineStage"],
        where: dateFilter,
        _count: { id: true },
      }),
      this.prisma.lead.groupBy({
        by: ["source"],
        where: dateFilter,
        _count: { id: true },
      }),
      this.prisma.leadPipelineHistory.findMany({
        where: { toStage: "CONTRACT_SIGNED" },
        select: { leadId: true },
        distinct: ["leadId"],
      }),
    ]);

    const conversionRate = totalLeads > 0 ? (signedLeads.length / totalLeads) * 100 : 0;

    const topRaw = await this.prisma.lead.groupBy({
      by: ["assignedTo"],
      where: { ...dateFilter, assignedTo: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const topSalesPeople = await Promise.all(
      topRaw.map(async (r) => {
        const user = r.assignedTo
          ? await this.prisma.user.findUnique({
              where: { id: r.assignedTo },
              select: { id: true, name: true, email: true },
            })
          : null;
        return {
          userId: r.assignedTo,
          name: user?.name ?? null,
          email: user?.email ?? null,
          count: r._count.id,
        };
      }),
    );

    return {
      totalLeads,
      leadsByStage: leadsByStage.map((l) => ({ stage: l.pipelineStage, count: l._count.id })),
      conversionRate,
      leadsBySource: leadsBySource.map((l) => ({ source: l.source, count: l._count.id })),
      topSalesPeople,
    };
  }

  async getRevenueReport(from?: string, to?: string) {
    const dateFilter = this.dateWhere(from, to);
    const invoices = await this.prisma.invoice.findMany({
      where: dateFilter,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        clientId: true,
      },
    });

    const monthlyMap: Record<string, number> = {};
    let paidTotal = 0;
    let paidCount = 0;
    let unpaidTotal = 0;
    let unpaidCount = 0;

    for (const inv of invoices) {
      const month = inv.createdAt.toISOString().slice(0, 7);
      monthlyMap[month] = (monthlyMap[month] || 0) + inv.amount;

      if (inv.status === "PAID") {
        paidTotal += inv.amount;
        paidCount++;
      } else {
        unpaidTotal += inv.amount;
        unpaidCount++;
      }
    }

    const monthlyRevenue = Object.entries(monthlyMap).map(([month, total]) => ({
      month,
      total,
    }));

    const avgInvoiceValue =
      invoices.length > 0
        ? invoices.reduce((s, i) => s + i.amount, 0) / invoices.length
        : 0;

    const clientMap: Record<string, { total: number; count: number }> = {};
    for (const inv of invoices) {
      if (!clientMap[inv.clientId]) clientMap[inv.clientId] = { total: 0, count: 0 };
      clientMap[inv.clientId].total += inv.amount;
      clientMap[inv.clientId].count += 1;
    }

    const topEntries = Object.entries(clientMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10);

    const topClients = await Promise.all(
      topEntries.map(async ([clientId, data]) => {
        const client = await this.prisma.client.findUnique({
          where: { id: clientId },
          select: { id: true, companyName: true },
        });
        return {
          clientId,
          companyName: client?.companyName ?? null,
          total: data.total,
          invoiceCount: data.count,
        };
      }),
    );

    return {
      monthlyRevenue,
      paidVsUnpaid: {
        paid: { count: paidCount, total: paidTotal },
        unpaid: { count: unpaidCount, total: unpaidTotal },
      },
      avgInvoiceValue,
      topClients,
    };
  }

  async getProjectsReport(from?: string, to?: string) {
    const dateFilter = this.dateWhere(from, to);
    const projects = await this.prisma.project.findMany({
      where: dateFilter,
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        completionPercentage: true,
      },
    });

    const total = projects.length;
    const statusMap: Record<string, number> = {};

    for (const p of projects) {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    }

    const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    const durations = projects
      .filter((p) => p.startDate && p.endDate)
      .map((p) => Math.ceil((p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const avgDuration =
      durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;

    const now = new Date();
    const overdueCount = projects.filter(
      (p) => p.endDate < now && p.status !== "COMPLETED" && p.status !== "CANCELLED",
    ).length;

    const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
    const completionRate = total > 0 ? (completedCount / total) * 100 : 0;

    return { total, byStatus, avgDuration, overdueCount, completionRate };
  }

  async getTeamPerformanceReport(from?: string, to?: string) {
    const dateFilter = this.dateWhere(from, to);

    const [workloads, taskHistory] = await Promise.all([
      this.prisma.staffWorkload.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.taskStatusHistory.findMany({
        where: { toStatus: "DONE", ...dateFilter },
        select: { id: true, changedBy: true },
      }),
    ]);

    const tasksByUser: Record<string, number> = {};
    for (const h of taskHistory) {
      tasksByUser[h.changedBy] = (tasksByUser[h.changedBy] || 0) + 1;
    }

    const team = workloads.map((w) => ({
      userId: w.userId,
      userName: w.user?.name ?? null,
      userEmail: w.user?.email ?? null,
      activeTasksCount: w.activeTasksCount,
      workloadStatus: w.workloadStatus,
      avgCompletionSpeedDays: w.avgCompletionSpeedDays,
      avgQualityScore: w.avgQualityScore,
      tasksCompleted: tasksByUser[w.userId] ?? 0,
    }));

    return { team };
  }

  async getSatisfactionReport(from?: string, to?: string) {
    const dateFilter = this.dateWhere(from, to);
    const ratings = await this.prisma.satisfactionRating.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
    });

    const avgScore =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
        : 0;

    const scoreMap: Record<number, number> = {};
    for (const r of ratings) {
      scoreMap[r.score] = (scoreMap[r.score] || 0) + 1;
    }

    const ratingsByScore = Object.entries(scoreMap).map(([score, count]) => ({
      score: Number(score),
      count,
    }));

    const recentLowRatings = ratings
      .filter((r) => r.score <= 2)
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        clientId: r.clientId,
        projectId: r.projectId,
        createdAt: r.createdAt,
      }));

    const trendMap: Record<string, { total: number; count: number }> = {};
    for (const r of ratings) {
      const month = r.createdAt.toISOString().slice(0, 7);
      if (!trendMap[month]) trendMap[month] = { total: 0, count: 0 };
      trendMap[month].total += r.score;
      trendMap[month].count += 1;
    }

    const trend = Object.entries(trendMap).map(([month, data]) => ({
      month,
      avgScore: data.total / data.count,
      count: data.count,
    }));

    return { avgScore, ratingsByScore, recentLowRatings, trend };
  }

  async getCampaignsReport(from?: string, to?: string) {
    const dateFilter = this.dateWhere(from, to);
    const campaigns = await this.prisma.campaign.findMany({
      where: dateFilter,
      select: {
        id: true,
        status: true,
        platform: true,
        budgetTotal: true,
        budgetSpent: true,
      },
    });

    const statusMap: Record<string, number> = {};
    const platformMap: Record<
      string,
      { count: number; budgetTotal: number; budgetSpent: number }
    > = {};
    let totalBudget = 0;
    let totalSpent = 0;

    for (const c of campaigns) {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
      totalBudget += c.budgetTotal;
      totalSpent += c.budgetSpent;

      if (!platformMap[c.platform]) {
        platformMap[c.platform] = { count: 0, budgetTotal: 0, budgetSpent: 0 };
      }
      platformMap[c.platform].count += 1;
      platformMap[c.platform].budgetTotal += c.budgetTotal;
      platformMap[c.platform].budgetSpent += c.budgetSpent;
    }

    const totalByStatus = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));

    const platformBreakdown = Object.entries(platformMap).map(([platform, data]) => ({
      platform,
      ...data,
    }));

    const snapshots = await this.prisma.campaignKpiSnapshot.findMany({
      where: dateFilter,
      select: { revenue: true },
    });

    const totalRevenue = snapshots.reduce((s, sn) => s + sn.revenue, 0);
    const avgROI = totalSpent > 0 ? totalRevenue / totalSpent : 0;

    return { totalByStatus, totalBudget, totalSpent, avgROI, platformBreakdown };
  }

  async exportReport(type: string, format: string, from?: string, to?: string) {
    const data = await this.getReportData(type, from, to);
    return { type, format, from: from ?? null, to: to ?? null, data };
  }

  private async getReportData(type: string, from?: string, to?: string) {
    switch (type) {
      case "sales":
        return this.getSalesReport(from, to);
      case "revenue":
        return this.getRevenueReport(from, to);
      case "projects":
        return this.getProjectsReport(from, to);
      case "team-performance":
        return this.getTeamPerformanceReport(from, to);
      case "satisfaction":
        return this.getSatisfactionReport(from, to);
      case "campaigns":
        return this.getCampaignsReport(from, to);
      case "leads":
        return this.getLeadsReport(from, to);
      case "clients":
        return this.getClientReport(from, to);
      case "system-health":
        return this.getSystemHealthReport(from, to);
      default:
        throw new NotFoundException(`نوع التقرير "${type}" غير موجود`);
    }
  }

  // ── ReportSnapshot persistence ──────────────────────────────────────────────

  async saveSnapshot(reportType: string, period: ReportPeriod) {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (period === "DAILY") {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
    } else if (period === "WEEKLY") {
      const day = now.getDay();
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const from = periodStart.toISOString();
    const to = periodEnd.toISOString();

    let data: Record<string, unknown>;

    switch (reportType) {
      case "sales":
        data = {
          ...(await this.getSalesReport(from, to)),
          kpis: await this.kpiService.getSalesKpis(from, to),
        };
        break;
      case "clients":
        data = {
          ...(await this.getClientReport(from, to)),
          kpis: await this.kpiService.getClientKpis(from, to),
        };
        break;
      case "projects":
        data = {
          ...(await this.getProjectsReport(from, to)),
          kpis: await this.kpiService.getProjectKpis(from, to),
        };
        break;
      case "tasks":
        data = {
          ...(await this.kpiService.getTaskKpis(from, to)),
        };
        break;
      case "system-health":
        data = {
          ...(await this.getSystemHealthReport(from, to)),
        };
        break;
      case "finance":
        data = {
          ...(await this.getRevenueReport(from, to)),
        };
        break;
      default: {
        // Full snapshot: compute everything
        const [sales, client, projects, task, systemK, revenue] =
          await Promise.all([
            this.getSalesReport(from, to),
            this.getClientReport(from, to),
            this.getProjectsReport(from, to),
            this.kpiService.getTaskKpis(from, to),
            this.kpiService.getSystemKpis(from, to),
            this.getRevenueReport(from, to),
          ]);
        data = {
          sales,
          clients: client,
          projects,
          tasks: task,
          system: systemK,
          finance: revenue,
        };
        break;
      }
    }

    const snapshot = await this.prisma.reportSnapshot.create({
      data: {
        reportType,
        period,
        periodStart,
        periodEnd,
        data: data as any,
      },
    });

    return snapshot;
  }

  async getSnapshots(reportType?: string, period?: string, limit = 12) {
    const where: any = {};
    if (reportType) where.reportType = reportType;
    if (period) where.period = period;

    const snapshots = await this.prisma.reportSnapshot.findMany({
      where,
      orderBy: { periodStart: "desc" },
      take: limit,
    });

    // Add period-over-period change % if 2+ snapshots share same reportType/period
    const withTrends = snapshots.map((s, i) => {
      const prev = snapshots[i + 1];
      const change =
        prev && typeof prev.data === "object" && prev.data !== null
          ? this.computeChange(prev.data as Record<string, unknown>, s.data as Record<string, unknown>)
          : null;
      return { ...s, change };
    });

    return withTrends;
  }

  private computeChange(
    prev: Record<string, unknown>,
    curr: Record<string, unknown>,
  ): Record<string, number> | null {
    const change: Record<string, number> = {};
    for (const key of Object.keys(curr)) {
      const cVal = curr[key];
      const pVal = prev[key];
      if (typeof cVal === "number" && typeof pVal === "number" && pVal !== 0) {
        change[key] = Math.round(((cVal - pVal) / pVal) * 1000) / 10;
      }
    }
    return Object.keys(change).length > 0 ? change : null;
  }

  // ── New report types ────────────────────────────────────────────────────────

  async getLeadsReport(from?: string, to?: string) {
    const [salesReport, kpis] = await Promise.all([
      this.getSalesReport(from, to),
      this.kpiService.getSalesKpis(from, to),
    ]);

    const staleLeads = await this.prisma.lead.count({
      where: {
        isActive: true,
        OR: [
          { assignedTo: null },
          {
            lastContactAt: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });

    return {
      ...salesReport,
      averageResponseTimeHours: kpis.averageResponseTimeHours,
      requestAging: kpis.requestAging,
      staleLeads,
    };
  }

  async getClientReport(from?: string, to?: string) {
    const [clients, kpis, satisfaction] = await Promise.all([
      this.prisma.client.findMany({
        where: this.dateWhere(from, to),
        select: {
          id: true,
          companyName: true,
          status: true,
          totalProjects: true,
          totalContractValue: true,
          totalPaid: true,
          avgSatisfactionScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.kpiService.getClientKpis(from, to),
      this.prisma.satisfactionRating.aggregate({
        _avg: { score: true },
        _count: { id: true },
      }),
    ]);

    return {
      clients: clients.map((c) => ({
        id: c.id,
        companyName: c.companyName,
        status: c.status,
        totalProjects: c.totalProjects,
        totalContractValue: c.totalContractValue,
        totalPaid: c.totalPaid,
        avgSatisfactionScore: c.avgSatisfactionScore,
        createdAt: c.createdAt.toISOString(),
      })),
      summary: kpis,
      satisfaction: {
        avgScore: satisfaction._avg.score ?? 0,
        totalRatings: satisfaction._count.id,
      },
    };
  }

  async getSystemHealthReport(from?: string, to?: string) {
    const [kpis, gateways, paymentCounts, externalServices] = await Promise.all([
      this.kpiService.getSystemKpis(from, to),
      this.prisma.paymentGateway.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.payment.groupBy({
        by: ["gatewayId"],
        _count: { id: true },
      }),
      this.prisma.externalServiceHealth.findMany({
        select: {
          serviceName: true,
          status: true,
          responseTime: true,
          lastCheckedAt: true,
          consecutiveFailures: true,
        },
      }),
    ]);

    const paymentCountMap = new Map(
      paymentCounts.map((p) => [p.gatewayId, p._count.id]),
    );

    return {
      ...kpis,
      gateways: gateways.map((g) => ({
        id: g.id,
        provider: g.name,
        type: g.type,
        healthStatus: g.isActive ? "HEALTHY" : "DOWN",
        totalPayments: paymentCountMap.get(g.id) ?? 0,
      })),
      externalServices: externalServices.map((s) => ({
        serviceName: s.serviceName,
        status: s.status,
        responseTime: s.responseTime,
        lastCheckedAt: s.lastCheckedAt.toISOString(),
        consecutiveFailures: s.consecutiveFailures,
      })),
    };
  }
}
