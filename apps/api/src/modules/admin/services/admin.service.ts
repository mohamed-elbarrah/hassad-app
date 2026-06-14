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
