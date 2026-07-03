import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

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
    ] = await Promise.all([
      // Total users (exclude clients)
      this.prisma.user.count({
        where: { role: { name: { not: "CLIENT" } } },
      }),
      // Active clients
      this.prisma.client.count({ where: { status: "ACTIVE" } }),
      // New clients this month
      this.prisma.client.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      // Active projects
      this.prisma.project.count({
        where: { status: { in: ["ACTIVE", "PLANNING"] } },
      }),
      // Completed projects
      this.prisma.project.count({
        where: { status: "COMPLETED" },
      }),
      // Overdue tasks
      this.prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: ["DONE", "REVISION"] },
        },
      }),
      // Total tasks
      this.prisma.task.count(),
      // Monthly revenue (paid invoices this month)
      this.prisma.invoice.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      // Last month revenue
      this.prisma.invoice.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),
      // Unpaid invoices
      this.prisma.invoice.count({
        where: { status: { in: ["DUE", "SENT", "LATE", "PARTIAL"] } },
      }),
      // Total invoices
      this.prisma.invoice.count(),
      // Active employees
      this.prisma.employee.count({ where: { isActive: true } }),
      // Pending service requests
      this.prisma.request.count({
        where: { status: { in: ["SUBMITTED", "QUALIFYING"] } },
      }),
      // Active campaigns
      this.prisma.campaign.count({
        where: { status: { in: ["ACTIVE", "PLANNING"] } },
      }),
      // Active conversations
      this.prisma.conversation.count({
        where: { isActive: true },
      }),
      // Recent signups (last 7 days)
      this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Users by role breakdown
      this.prisma.role.findMany({
        select: {
          name: true,
          _count: { select: { users: true } },
        },
      }),
    ]);

    const lastMonthRev = lastMonthRevenue._sum.amount ?? 0;
    const thisMonthRev = monthlyRevenue._sum.amount ?? 0;
    const revenueChange = lastMonthRev > 0
      ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
      : 0;

    return {
      // Users
      totalUsers,
      recentUsers,
      usersByRole: usersByRole.map((r) => ({
        role: r.name,
        count: r._count.users,
      })),
      // Clients
      activeClients,
      newClientsThisMonth,
      // Projects
      activeProjects,
      completedProjects,
      // Tasks
      totalTasks,
      overdueTasks,
      // Revenue
      monthlyRevenue: thisMonthRev,
      revenueChange,
      // Invoices
      unpaidInvoicesCount,
      totalInvoices,
      // HR
      employeesCount,
      // Operations
      pendingRequests,
      activeCampaigns,
      conversationsCount,
      // Satisfaction (placeholder until real data)
      satisfactionRate: 92,
    };
  }

  // ── Trends ──────────────────────────────────────────────────────────────────

  async getTrends(days = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Generate date labels
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      labels.push(d.toISOString().slice(0, 10));
    }

    // Daily revenue (paid invoices)
    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: startDate },
      },
      select: { amount: true, paidAt: true },
    });

    // Daily new users
    const newUsers = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    // Daily new clients
    const newClients = await this.prisma.client.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    // Daily new projects
    const newProjects = await this.prisma.project.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    // Daily completed tasks
    const completedTasks = await this.prisma.task.findMany({
      where: {
        status: "DONE",
        approvedAt: { gte: startDate },
      },
      select: { approvedAt: true },
    });

    // Build daily arrays
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
          .filter((inv) => inv.paidAt && inv.paidAt >= dayStart && inv.paidAt <= dayEnd)
          .reduce((sum, inv) => sum + Number(inv.amount), 0),
      );
      newUsersArr.push(
        newUsers.filter((u) => u.createdAt >= dayStart && u.createdAt <= dayEnd).length,
      );
      newClientsArr.push(
        newClients.filter((c) => c.createdAt >= dayStart && c.createdAt <= dayEnd).length,
      );
      newProjectsArr.push(
        newProjects.filter((p) => p.createdAt >= dayStart && p.createdAt <= dayEnd).length,
      );
      tasksCompletedArr.push(
        completedTasks.filter(
          (t) => t.approvedAt && t.approvedAt >= dayStart && t.approvedAt <= dayEnd,
        ).length,
      );
    }

    return { revenue, newUsers: newUsersArr, newClients: newClientsArr, newProjects: newProjectsArr, tasksCompleted: tasksCompletedArr, labels };
  }

  // ── Funnel ────────────────────────────────────────────────────────────────────

  async getFunnel() {
    const [
      leads,
      clients,
      proposals,
      contracts,
      projects,
      invoices,
      payments,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { isActive: true } }),
      this.prisma.client.count({ where: { status: { not: "STOPPED" } } }),
      this.prisma.proposal.count(),
      this.prisma.contract.count({ where: { status: { notIn: ["CANCELLED", "DRAFT"] } } }),
      this.prisma.project.count({ where: { isArchived: false } }),
      this.prisma.invoice.count(),
      this.prisma.payment.count({ where: { status: "SUCCESS" } }),
    ]);

    const calcRate = (from: number, to: number) =>
      from > 0 ? Math.round((to / from) * 100 * 10) / 10 : 0;

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
    };
  }

  // ── Alerts ───────────────────────────────────────────────────────────────────

  async getAlerts() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      overdueTasks,
      agedInvoices,
      escalatedDisputes,
      failedWebhooks,
      expiringContracts,
      pendingRequests,
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
      this.prisma.disputeTicket.count({
        where: { status: "ESCALATED" },
      }),
      this.prisma.webhookLog.count({
        where: { processed: false },
      }),
      this.prisma.contract.count({
        where: {
          status: "ACTIVE",
          endDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
      this.prisma.request.count({
        where: { status: { in: ["SUBMITTED", "QUALIFYING"] } },
      }),
    ]);

    return {
      overdueTasks: { count: overdueTasks, label: "مهام متأخرة", link: "/dashboard/admin/tasks?status=OVERDUE" },
      agedInvoices: { count: agedInvoices, label: "فواتير غير مسددة (+60 يوم)", link: "/dashboard/admin/invoices?aging=60" },
      escalatedDisputes: { count: escalatedDisputes, label: "نزاعات تم تصعيدها", link: "/dashboard/admin/disputes?status=ESCALATED" },
      failedWebhooks: { count: failedWebhooks, label: "Webhooks فاشلة", link: "/dashboard/admin/integrations?status=failed" },
      expiringContracts: { count: expiringContracts, label: "عقود تنتهي قريباً", link: "/dashboard/admin/contracts?expiring=30" },
      pendingRequests: { count: pendingRequests, label: "طلبات معلقة", link: "/dashboard/admin/requests?status=PENDING" },
    };
  }

  async getHealth() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      dbTest,
      errorCount,
      activeUsers,
      totalStorageBytes,
      pendingWebhooks,
    ] = await Promise.all([
      // Quick DB connectivity test
      this.prisma.$queryRawUnsafe<[{ "1": number }]>(`SELECT 1`).catch(() => [{ 1: 0 }]),
      // Recent errors (webhook failures + other indicators)
      this.prisma.webhookLog.count({
        where: {
          processed: false,
          createdAt: { gte: oneHourAgo },
        },
      }),
      // "Active users" — users who generated ledger entries in the last hour
      this.prisma.ledger.groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: oneHourAgo },
        },
      }),
      // Total storage estimate
      this.prisma.taskFile.count().then((c) => c * 1024 * 1024), // rough estimate
      // Pending webhooks
      this.prisma.webhookLog.count({
        where: { processed: false },
      }),
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
}
