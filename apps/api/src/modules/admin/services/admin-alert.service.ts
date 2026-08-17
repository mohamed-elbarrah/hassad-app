import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";

@Injectable()
export class AdminAlertService {
  private readonly logger = new Logger(AdminAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Stalled projects ───────────────────────────────────────────────────
  async checkStalledProjects(): Promise<number> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const stalled = await this.prisma.project.findMany({
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
      include: {
        manager: { select: { id: true } },
        client: { select: { accountManager: true } },
      },
    });

    let notified = 0;
    for (const project of stalled) {
      const pmId = project.manager?.id;
      const amId = project.client?.accountManager;
      const recipientIds = [pmId, amId].filter(Boolean) as string[];
      if (recipientIds.length === 0) continue;

      // Avoid duplicate notification within 24h for same project
      const existing = await this.prisma.notificationEvent.findFirst({
        where: {
          entityId: project.id,
          entityType: "PROJECT",
          eventType: "PROJECT_STALLED",
          triggeredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (existing) continue;

      await this.notificationsService.notifyUsers({
        userIds: recipientIds,
        title: "مشروع متعثر",
        message: `المشروع "${project.name}" متعثر (الحالة: ${project.status}). يرجى المراجعة.`,
        entityId: project.id,
        entityType: "PROJECT",
        eventType: "PROJECT_STALLED",
      });
      notified++;
    }

    if (notified > 0)
      this.logger.log(`Stalled projects: ${notified} notification(s) sent`);
    return notified;
  }

  // Legacy method name retained for scheduler compatibility. Requests are
  // the only active CRM source.
  async checkUnassignedLeads(): Promise<number> {
    return this.checkUnassignedRequests();
  }

  // ── Unassigned requests ────────────────────────────────────────────────
  async checkUnassignedRequests(): Promise<number> {
    const unassigned = await this.prisma.request.findMany({
      where: { status: "SUBMITTED", assignedSalesId: null },
      select: { id: true, companyName: true, contactName: true },
      take: 50,
    });

    if (unassigned.length === 0) return 0;

    const salesManagers = await this.prisma.user.findMany({
      where: {
        role: { name: { in: ["ADMIN", "SALES_MANAGER"] } },
        isActive: true,
      },
      select: { id: true },
    });
    if (salesManagers.length === 0) return 0;

    const managerIds = salesManagers.map((u) => u.id);
    await this.notificationsService.notifyUsers({
      userIds: managerIds,
      title: "طلبات غير معينة",
      message: `يوجد ${unassigned.length} طلب غير معين. يرجى توزيعهم على فريق المبيعات.`,
      entityId: "unassigned-requests",
      entityType: "REQUEST",
      eventType: "UNASSIGNED_REQUEST",
    });

    this.logger.log(
      `Unassigned requests alert sent to ${managerIds.length} manager(s)`,
    );
    return unassigned.length;
  }

  // ── Failed systems (webhook/gateway via SystemEventLog) ────────────────
  async checkFailedSystems(): Promise<number> {
    const openFailures = await this.prisma.systemEventLog.findMany({
      where: {
        eventType: { in: ["WEBHOOK_FAILURE", "GATEWAY_FAILURE"] },
        status: "OPEN",
      },
      select: { id: true, eventType: true, source: true, message: true },
      take: 50,
    });

    if (openFailures.length === 0) return 0;

    // Deduplicate: only alert if no SYSTEM_FAILURE notification for same event in last 6h
    const existingEvents = await this.prisma.notificationEvent.findMany({
      where: {
        eventType: "SYSTEM_FAILURE",
        triggeredAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
      select: { metadata: true },
    });
    const alreadyAlertedIds = new Set(
      existingEvents
        .map((e) => (e.metadata as any)?.systemEventId)
        .filter(Boolean),
    );

    const newFailures = openFailures.filter(
      (f) => !alreadyAlertedIds.has(f.id),
    );
    if (newFailures.length === 0) return 0;

    const admins = await this.prisma.user.findMany({
      where: { role: { name: "ADMIN" }, isActive: true },
      select: { id: true },
    });
    if (admins.length === 0) return 0;

    const adminIds = admins.map((u) => u.id);
    const webhookCount = newFailures.filter(
      (f) => f.eventType === "WEBHOOK_FAILURE",
    ).length;
    const gatewayCount = newFailures.filter(
      (f) => f.eventType === "GATEWAY_FAILURE",
    ).length;

    await this.notificationsService.notifyUsers({
      userIds: adminIds,
      title: "أخطاء نظام",
      message: `يوجد ${webhookCount} خطأ ويب هوك و ${gatewayCount} خطأ بوابة دفع بحاجة للمراجعة.`,
      entityId: "system-failures",
      entityType: "system",
      eventType: "SYSTEM_FAILURE",
      metadata: { systemEventIds: newFailures.map((f) => f.id) },
    });

    this.logger.log(`System failure alert sent to ${adminIds.length} admin(s)`);
    return newFailures.length;
  }

  // ── Inactive clients ───────────────────────────────────────────────────
  async checkInactiveClients(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const inactive = await this.prisma.client.findMany({
      where: {
        status: "ACTIVE",
        updatedAt: { lt: thirtyDaysAgo },
        suspendedAt: null,
        OR: [
          { projects: { none: { createdAt: { gte: thirtyDaysAgo } } } },
          { requests: { none: { createdAt: { gte: thirtyDaysAgo } } } },
          { contracts: { none: { createdAt: { gte: thirtyDaysAgo } } } },
        ],
      },
      select: {
        id: true,
        companyName: true,
        accountManager: true,
        userId: true,
      },
    });

    let notified = 0;
    for (const client of inactive) {
      const existing = await this.prisma.notificationEvent.findFirst({
        where: {
          entityId: client.id,
          entityType: "CLIENT",
          eventType: "CLIENT_INACTIVE",
          triggeredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });
      if (existing) continue;

      const recipients = [client.accountManager, client.userId].filter(
        Boolean,
      ) as string[];
      if (recipients.length === 0) continue;

      await this.notificationsService.notifyUsers({
        userIds: recipients,
        title: "عميل غير نشط",
        message: `العميل "${client.companyName}" غير نشط منذ أكثر من 30 يوماً. يرجى التواصل معهم.`,
        entityId: client.id,
        entityType: "CLIENT",
        eventType: "CLIENT_INACTIVE",
      });
      notified++;
    }

    if (notified > 0)
      this.logger.log(`Inactive clients: ${notified} notification(s) sent`);
    return notified;
  }

  // ── Workload alerts ────────────────────────────────────────────────────
  async checkWorkload(): Promise<number> {
    const workloads = await this.prisma.staffWorkload.findMany({
      include: {
        user: {
          select: { id: true, name: true, role: { select: { name: true } } },
        },
      },
    });

    if (workloads.length === 0) return 0;

    const avgTasks =
      workloads.reduce((s, w) => s + w.activeTasksCount, 0) / workloads.length;
    const overloaded = workloads.filter(
      (w) => w.activeTasksCount > avgTasks * 2,
    );
    const underloaded = workloads.filter(
      (w) => w.activeTasksCount < avgTasks * 0.3 && avgTasks > 2,
    );

    let notified = 0;

    // Notify overloaded users
    for (const w of overloaded) {
      const existing = await this.prisma.notificationEvent.findFirst({
        where: {
          entityId: w.userId,
          entityType: "USER",
          eventType: "WORKLOAD_WARNING",
          triggeredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (existing) continue;

      await this.notificationsService.createNotification({
        userId: w.userId,
        title: "حمل عمل مرتفع",
        body: `لديك ${w.activeTasksCount} مهمة نشطة (المعدل: ${Math.round(avgTasks)}). يرجى مراجعة أولوياتك.`,
        entityId: w.userId,
        entityType: "USER",
        eventType: "WORKLOAD_WARNING",
      });
      notified++;
    }

    // Notify managers about underloaded team members
    if (underloaded.length > 0) {
      const managers = await this.prisma.user.findMany({
        where: {
          role: { name: { in: ["ADMIN", "PROJECT_MANAGER"] } },
          isActive: true,
        },
        select: { id: true },
      });
      if (managers.length > 0) {
        const names = underloaded
          .map((w) => w.user?.name)
          .filter(Boolean)
          .join("، ");
        await this.notificationsService.notifyUsers({
          userIds: managers.map((m) => m.id),
          title: "أعضاء فريق بحمل عمل منخفض",
          message: `الأعضاء التاليون لديهم حمل عمل منخفض: ${names}. يرجى إعادة توزيع المهام.`,
          entityId: "workload",
          entityType: "system",
          eventType: "WORKLOAD_WARNING",
        });
        notified++;
      }
    }

    if (notified > 0)
      this.logger.log(`Workload alerts: ${notified} notification(s) sent`);
    return notified;
  }

  // ── Task delay alerts ──────────────────────────────────────────────────
  async checkDelayedTasks(): Promise<number> {
    const now = new Date();
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] },
      },
      include: {
        assignee: { select: { id: true } },
        project: { select: { name: true, projectManagerId: true } },
      },
    });

    let created = 0;
    for (const task of overdueTasks) {
      const existing = await this.prisma.taskDelayAlert.findFirst({
        where: { taskId: task.id, isAcknowledged: false },
      });
      if (existing) continue;

      const daysOverdue = Math.floor(
        (now.getTime() - task.dueDate.getTime()) / (24 * 60 * 60 * 1000),
      );
      const alertLevel =
        daysOverdue > 7 ? "HIGH" : daysOverdue > 3 ? "MEDIUM" : "LOW";

      await this.prisma.taskDelayAlert.create({
        data: {
          taskId: task.id,
          notifiedUserId:
            task.assignee?.id ?? task.project?.projectManagerId ?? "unknown",
          alertLevel: alertLevel as any,
        },
      });

      if (task.assignee?.id) {
        await this.notificationsService.createNotification({
          userId: task.assignee.id,
          title: "مهمة متأخرة",
          body: `المهمة "${task.title}" ${daysOverdue > 0 ? `متأخرة ${daysOverdue} يوماً` : "مستحقة اليوم"}.`,
          entityId: task.id,
          entityType: "TASK",
          eventType: "TASK_DELAYED",
        });
      }
      created++;
    }

    if (created > 0) this.logger.log(`Task delay alerts: ${created} created`);
    return created;
  }

  // ── Auto-flag stale records (gated by feature flag) ────────────────────
  async checkStaleRecords(): Promise<{
    flaggedLeads: number;
    flaggedRequests: number;
  }> {
    const featureFlag = await this.prisma.companySetting.findUnique({
      where: { key: "feature.auto_flag_stale" },
    });
    if (!featureFlag || featureFlag.value !== true) {
      return { flaggedLeads: 0, flaggedRequests: 0 };
    }

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const staleLeads: never[] = [];

    const staleRequests = await this.prisma.request.findMany({
      where: {
        status: { notIn: ["PROJECT_CREATED", "CANCELLED"] },
        updatedAt: { lt: fourteenDaysAgo },
      },
      select: { id: true, companyName: true, contactName: true, assignedSalesId: true },
    });

    for (const req of staleRequests) {
      if (req.assignedSalesId) {
        await this.notificationsService.createNotification({
          userId: req.assignedSalesId,
          title: "طلب بحاجة للمتابعة",
          body: `طلب "${req.contactName}" (${req.companyName}) لم يتم تحديثه منذ 14 يوماً.`,
          entityId: req.id,
          entityType: "REQUEST",
          eventType: "STALE_REQUEST",
        });
      }
    }

    if (staleLeads.length > 0 || staleRequests.length > 0) {
      this.logger.log(
        `Stale records flagged: ${staleLeads.length} leads, ${staleRequests.length} requests`,
      );
    }

    return {
      flaggedLeads: staleLeads.length,
      flaggedRequests: staleRequests.length,
    };
  }

  // ── Run all checks ─────────────────────────────────────────────────────
  async runAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    const checks = [
      ["stalledProjects", () => this.checkStalledProjects()],
      ["unassignedRequests", () => this.checkUnassignedRequests()],
      ["failedSystems", () => this.checkFailedSystems()],
      ["inactiveClients", () => this.checkInactiveClients()],
      ["workload", () => this.checkWorkload()],
      ["delayedTasks", () => this.checkDelayedTasks()],
      ["staleRecords", () => this.checkStaleRecords()],
    ] as const;

    for (const [name, fn] of checks) {
      try {
        results[name] = await fn();
      } catch (err: any) {
        results[name] = { error: err.message };
        this.logger.error(
          `Alert check "${name}" failed: ${err.message}`,
          err.stack,
        );
      }
    }

    return results;
  }
}
