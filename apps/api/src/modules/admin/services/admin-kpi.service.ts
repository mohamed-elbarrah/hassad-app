import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminKpiService {
  constructor(private readonly prisma: PrismaService) {}

  private dateFilter(from?: string, to?: string) {
    const filter: any = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.gte = new Date(from);
      if (to) filter.createdAt.lte = new Date(to);
    }
    return filter;
  }

  async getSalesKpis(from?: string, to?: string) {
    const dateFilter = this.dateFilter(from, to);

    const [
      totalLeads,
      leadsWithRequest,
      totalRequests,
      requestsWithContracts,
      leadsWithFirstContact,
      requestAges,
      unassignedLeads,
    ] = await Promise.all([
      this.prisma.request.count({ where: dateFilter }),
      this.prisma.request.count({ where: dateFilter }),
      this.prisma.request.count({ where: dateFilter }),
      this.prisma.contract.count({ where: { requestId: { not: null }, ...dateFilter } }),
      this.prisma.request.findMany({
        where: { lastContactAt: { not: null }, ...dateFilter },
        select: { createdAt: true, lastContactAt: true },
      }),
      this.prisma.request.findMany({
        where: { status: { notIn: ["SIGNED", "PROJECT_CREATED", "CANCELLED"] }, ...dateFilter },
        select: { createdAt: true },
      }),
      this.prisma.request.count({ where: { assignedSalesId: null, ...dateFilter } }),
    ]);

    const leadToRequestConversion =
      totalLeads > 0 ? (leadsWithRequest / totalLeads) * 100 : 0;
    const requestToContractConversion =
      totalRequests > 0 ? (requestsWithContracts / totalRequests) * 100 : 0;

    const responseTimeHours =
      leadsWithFirstContact.length > 0
        ? leadsWithFirstContact.reduce((sum, l) => {
            const diff =
              (l.lastContactAt!.getTime() - l.createdAt.getTime()) /
              (1000 * 60 * 60);
            return sum + diff;
          }, 0) / leadsWithFirstContact.length
        : 0;

    const now = Date.now();
    const ageBuckets = { "0-7": 0, "8-14": 0, "15-30": 0, "30+": 0 };
    for (const r of requestAges) {
      const days = (now - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (days <= 7) ageBuckets["0-7"]++;
      else if (days <= 14) ageBuckets["8-14"]++;
      else if (days <= 30) ageBuckets["15-30"]++;
      else ageBuckets["30+"]++;
    }

    return {
      totalLeads,
      unassignedLeads,
      leadToRequestConversion,
      requestToContractConversion,
      averageResponseTimeHours: Math.round(responseTimeHours * 10) / 10,
      requestAging: Object.entries(ageBuckets).map(([bucket, count]) => ({
        bucket,
        count,
      })),
    };
  }

  async getClientKpis(from?: string, to?: string) {
    const dateFilter = this.dateFilter(from, to);

    const [
      totalClients,
      statusCounts,
      repeatClients,
      churned,
      activeAtPeriodStart,
    ] = await Promise.all([
      this.prisma.client.count({ where: dateFilter }),
      this.prisma.client.groupBy({
        by: ["status"],
        where: dateFilter,
        _count: { id: true },
      }),
      // Repeat clients: 2+ projects
      this.prisma.client.count({
        where: {
          projects: { some: {} },
          ...dateFilter,
        },
      }),
      // Churned (STOPPED) in period
      this.prisma.client.count({
        where: { status: "STOPPED", ...dateFilter },
      }),
      // Active at period start
      this.prisma.client.count({
        where: {
          OR: [
            { status: "ACTIVE" },
            ...(to
              ? ([
                  { status: "STOPPED", suspendedAt: { gte: new Date(to) } },
                ] as const)
              : []),
          ],
        },
      }),
    ]);

    // Repeat clients: those with 2+ projects
    const repeatRaw = await this.prisma.client.findMany({
      where: {
        projects: { some: {} },
        ...dateFilter,
      },
      select: {
        id: true,
        _count: { select: { projects: true, contracts: true } },
      },
    });

    const repeatClientCount = repeatRaw.filter(
      (c) => c._count.projects >= 2,
    ).length;
    const retainedCount = repeatRaw.filter(
      (c) => c._count.contracts >= 2,
    ).length;

    const statusMap: Record<string, number> = {};
    for (const s of statusCounts) {
      statusMap[s.status] = s._count.id;
    }

    return {
      total: totalClients,
      byStatus: Object.entries(statusMap).map(([status, count]) => ({
        status,
        count,
      })),
      activeClients: statusMap["ACTIVE"] ?? 0,
      suspendedClients: statusMap["STOPPED"] ?? 0,
      newThisPeriod: statusMap["LEAD"] ?? 0,
      repeatClients: repeatClientCount,
      churnRate:
        activeAtPeriodStart > 0 ? (churned / activeAtPeriodStart) * 100 : 0,
      retentionRate:
        repeatClientCount > 0 ? (retainedCount / repeatClientCount) * 100 : 0,
    };
  }

  async getProjectKpis(from?: string, to?: string) {
    const dateFilter = this.dateFilter(from, to);

    const [
      projects,
      revisionStats,
      completedDuration,
      overdueCount,
      activeCount,
    ] = await Promise.all([
      this.prisma.project.findMany({
        where: dateFilter,
        select: {
          id: true,
          status: true,
          isArchived: true,
          startDate: true,
        },
      }),
      // Task revision stats
      this.prisma.task.aggregate({
        where: { project: { ...dateFilter } },
        _avg: { revisionCount: true },
        _count: { id: true },
      }),
      // Completed project durations
      this.prisma.project.findMany({
        where: { status: "COMPLETED", ...dateFilter },
        select: { startDate: true, endDate: true },
      }),
      // Overdue projects
      this.prisma.project.count({
        where: {
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          endDate: { lt: new Date() },
          ...dateFilter,
        },
      }),
      // Active projects
      this.prisma.project.count({
        where: { status: { in: ["ACTIVE", "PLANNING", "ON_HOLD"] } },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const p of projects) {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    }

    // Tasks with at least one revision
    const tasksWithRevision = await this.prisma.task.count({
      where: { revisionCount: { gt: 0 }, project: { ...dateFilter } },
    });

    // Total completed tasks
    const totalCompletedTasks = await this.prisma.taskStatusHistory.count({
      where: { toStatus: "DONE", ...dateFilter },
    });

    const revisionRate =
      totalCompletedTasks > 0
        ? (tasksWithRevision / totalCompletedTasks) * 100
        : 0;

    const avgDurationDays =
      completedDuration.length > 0
        ? completedDuration.reduce((sum, p) => {
            if (!p.startDate || !p.endDate) return sum;
            const days = Math.ceil(
              (p.endDate.getTime() - p.startDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return sum + days;
          }, 0) / completedDuration.length
        : 0;

    return {
      total: projects.length,
      byStatus: Object.entries(statusMap).map(([status, count]) => ({
        status,
        count,
      })),
      activeProjects: (statusMap["ACTIVE"] ?? 0) + (statusMap["PLANNING"] ?? 0),
      pendingActivation: statusMap["PENDING_ACTIVATION"] ?? 0,
      completedProjects: statusMap["COMPLETED"] ?? 0,
      stalledProjects: statusMap["ON_HOLD"] ?? 0,
      overdueProjects: overdueCount,
      overdueRatio: activeCount > 0 ? (overdueCount / activeCount) * 100 : 0,
      revisionRate: Math.round(revisionRate * 10) / 10,
      averageRevisionCount:
        revisionStats._count.id > 0
          ? Math.round((revisionStats._avg.revisionCount ?? 0) * 100) / 100
          : 0,
      averageCompletionTimeDays: Math.round(avgDurationDays * 10) / 10,
    };
  }

  async getTaskKpis(from?: string, to?: string) {
    const dateFilter = this.dateFilter(from, to);
    const now = new Date();

    const [byStatus, overdueTasks, blockedAndLoops, slaData, deptThroughput] =
      await Promise.all([
        this.prisma.task.groupBy({
          by: ["status"],
          where: dateFilter,
          _count: { id: true },
        }),
        this.prisma.task.count({
          where: {
            status: { notIn: ["DONE", "REVISION"] },
            dueDate: { lt: now },
            ...dateFilter,
          },
        }),
        // Find IN_REVIEW tasks older than 3 days + tasks with 3+ revisions
        this.prisma.task.findMany({
          where: {
            ...dateFilter,
            OR: [
              {
                status: "IN_REVIEW",
                createdAt: {
                  lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                },
              },
              { revisionCount: { gte: 3 } },
            ],
          },
          select: { id: true, status: true, revisionCount: true },
        }),
        // SLA: tasks completed on time
        this.prisma.task.findMany({
          where: { status: "DONE", ...dateFilter },
          select: { id: true, dueDate: true, approvedAt: true },
        }),
        // Team throughput by department
        this.prisma.taskStatusHistory.findMany({
          where: { toStatus: "DONE", ...dateFilter },
          select: {
            task: {
              select: {
                id: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
        }),
      ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) {
      statusMap[s.status] = s._count.id;
    }

    const blockedTasks = blockedAndLoops.filter(
      (t) => t.status === "IN_REVIEW" && t.revisionCount < 3,
    ).length;
    const revisionLoops = blockedAndLoops.filter(
      (t) => t.revisionCount >= 3,
    ).length;

    const slaLate = slaData.filter(
      (t) => t.dueDate && t.approvedAt && t.approvedAt > t.dueDate,
    ).length;
    const slaCompliance =
      slaData.length > 0
        ? ((slaData.length - slaLate) / slaData.length) * 100
        : 0;

    const deptMap: Record<string, { departmentName: string; count: number }> =
      {};
    for (const h of deptThroughput) {
      const deptId = h.task?.department?.id ?? "unknown";
      const deptName = h.task?.department?.name ?? "General";
      if (!deptMap[deptId]) {
        deptMap[deptId] = { departmentName: deptName, count: 0 };
      }
      deptMap[deptId].count++;
    }

    return {
      byStatus: Object.entries(statusMap).map(([status, count]) => ({
        status,
        count,
      })),
      total: byStatus.reduce((sum, s) => sum + s._count.id, 0),
      overdueTasks,
      blockedTasks,
      revisionLoops,
      slaCompliance: Math.round(slaCompliance * 10) / 10,
      teamThroughputByDepartment: Object.entries(deptMap).map(([id, data]) => ({
        departmentId: id,
        departmentName: data.departmentName,
        tasksCompleted: data.count,
      })),
    };
  }

  async getSystemKpis(from?: string, to?: string) {
    const dateFilter = this.dateFilter(from, to);

    const [
      failedWebhooks,
      failedNotifications,
      totalNotifications,
      securityEvents,
      systemErrors,
    ] = await Promise.all([
      this.prisma.webhookLog.count({
        where: { processed: false, ...dateFilter },
      }),
      this.prisma.notification.count({
        where: { sentAt: null, ...dateFilter },
      }),
      this.prisma.notification.count({ where: dateFilter }),
      this.prisma.securityEvent.groupBy({
        by: ["type"],
        where: dateFilter,
        _count: { id: true },
      }),
      this.prisma.systemError.groupBy({
        by: ["level", "category"],
        where: dateFilter,
        _count: { id: true },
      }),
    ]);

    const notificationFailureRate =
      totalNotifications > 0
        ? (failedNotifications / totalNotifications) * 100
        : 0;

    const impersonations = securityEvents
      .filter((e) => e.type === "IMPERSONATION")
      .reduce((sum, e) => sum + e._count.id, 0);

    return {
      failedWebhooks,
      failedNotifications,
      notificationFailureRate: Math.round(notificationFailureRate * 10) / 10,
      securityEventDistribution: securityEvents.map((e) => ({
        type: e.type,
        count: e._count.id,
      })),
      impersonationCount: impersonations,
      errorDistribution: systemErrors.map((e) => ({
        level: e.level,
        category: e.category,
        count: e._count.id,
      })),
    };
  }
}
