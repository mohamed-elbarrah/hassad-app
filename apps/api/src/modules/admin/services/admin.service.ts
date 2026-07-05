import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

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
      // Average satisfaction score (1-5 scale, convert to 0-100)
      this.prisma.satisfactionRating.aggregate({
        _avg: { score: true },
      }),
    ]);

    const lastMonthRev = lastMonthRevenue._sum.amount ?? 0;
    const thisMonthRev = monthlyRevenue._sum.amount ?? 0;
    const revenueChange =
      lastMonthRev > 0
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
      // Satisfaction — real average from SatisfactionRating table (score 1-5 → 0-100)
      satisfactionRate: satisfactionResult._avg.score
        ? Math.round(satisfactionResult._avg.score * 20)
        : null,
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

  // ── Funnel ────────────────────────────────────────────────────────────────────

  async getFunnel() {
    const [leads, clients, proposals, contracts, projects, invoices, payments] =
      await Promise.all([
        this.prisma.lead.count({ where: { isActive: true } }),
        this.prisma.client.count({ where: { status: { not: "STOPPED" } } }),
        this.prisma.proposal.count(),
        this.prisma.contract.count({
          where: { status: { notIn: ["CANCELLED", "DRAFT"] } },
        }),
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
        select: { id: true, ticketNumber: true, title: true, priority: true, escalatedAt: true },
      }),
      this.prisma.request.findMany({
        where: { status: { in: ["SUBMITTED", "QUALIFYING"] } },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, companyName: true, createdAt: true, contactName: true },
      }),
      this.prisma.contract.findMany({
        where: {
          status: "ACTIVE",
          endDate: { gte: now, lte: thirtyDaysFromNow },
        },
        take: 5,
        orderBy: { endDate: "asc" },
        select: { id: true, title: true, endDate: true, client: { select: { companyName: true } } },
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

  // ── Recent Activity ──────────────────────────────────────────────────────────

  async getRecentActivity() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [clientHistory, taskHistory, contractHistory, disputeHistory, requestHistory] =
      await Promise.all([
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

    const [
      dbTest,
      errorCount,
      activeUsers,
      totalStorageBytes,
      pendingWebhooks,
    ] = await Promise.all([
      // Quick DB connectivity test
      this.prisma
        .$queryRawUnsafe<[{ "1": number }]>(`SELECT 1`)
        .catch(() => [{ 1: 0 }]),
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
