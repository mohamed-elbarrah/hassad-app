import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

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
      default:
        throw new NotFoundException(`نوع التقرير "${type}" غير موجود`);
    }
  }
}
