import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TaskStatus, UserRole } from "@hassad/shared";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications.service";

@Injectable()
export class EscalationCronService {
  private readonly logger = new Logger(EscalationCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Every 30 minutes: check for tasks whose startDate has passed and
   * they are still TODO. Escalate through levels 0→1→2→3.
   *
   * Level 0 → 1: notify Employee (TASK_DELAY_WARNING)      at 0h overdue
   * Level 1 → 2: notify Project Manager (TASK_ESCALATED_PM) at 2h overdue
   * Level 2 → 3: notify all Admins (TASK_ESCALATED_ADMIN)  at 24h overdue
   */
  @Cron("0 */30 * * * *")
  async checkEscalations(): Promise<void> {
    const now = new Date();

    try {
      const tasks = await this.prisma.task.findMany({
        where: {
          status: TaskStatus.TODO,
          startDate: { lt: now },
          archivedAt: null,
          escalationLevel: { lt: 3 },
        },
        select: {
          id: true,
          title: true,
          assignedTo: true,
          escalationLevel: true,
          startDate: true,
          project: { select: { managerId: true } },
        },
      });

      if (tasks.length === 0) return;

      this.logger.log(
        `Escalation check: ${tasks.length} task(s) eligible for escalation`,
      );

      const adminUsers = await this.prisma.user.findMany({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
      });

      for (const task of tasks) {
        try {
          await this.escalateTask(task, now, adminUsers);
        } catch (error) {
          this.logger.error(`Failed to escalate task ${task.id}`, error);
        }
      }
    } catch (error) {
      this.logger.error("Escalation cron job failed", error);
    }
  }

  private async escalateTask(
    task: {
      id: string;
      title: string;
      assignedTo: string;
      escalationLevel: number;
      startDate: Date | null;
      project: { managerId: string };
    },
    now: Date,
    adminUsers: { id: string }[],
  ): Promise<void> {
    if (!task.startDate) return;

    const hoursOverdue =
      (now.getTime() - task.startDate.getTime()) / (1000 * 60 * 60);

    if (hoursOverdue >= 24 && task.escalationLevel === 2) {
      // Level 2 → 3: notify all admins
      await this.prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { escalationLevel: 3, escalationNotifiedAt: now },
        });

        if (adminUsers.length > 0) {
          await tx.notification.createMany({
            data: adminUsers.map((admin) => ({
              userId: admin.id,
              type: NotificationType.TASK_ESCALATED_ADMIN,
              title: "تصعيد عاجل: مهمة بلا تقدم",
              message: `المهمة "${task.title}" متأخرة 24+ ساعة`,
              entityId: task.id,
              entityType: "task",
            })),
          });
        }
      });

      this.logger.warn(
        `Task ${task.id} escalated to ADMIN level (24h+ overdue)`,
      );
    } else if (hoursOverdue >= 2 && task.escalationLevel === 1) {
      // Level 1 → 2: notify PM
      await this.prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { escalationLevel: 2, escalationNotifiedAt: now },
        });

        await tx.notification.create({
          data: {
            userId: task.project.managerId,
            type: NotificationType.TASK_ESCALATED_PM,
            title: "تصعيد: مهمة متأخرة",
            message: `المهمة "${task.title}" متأخرة 2+ ساعة`,
            entityId: task.id,
            entityType: "task",
          },
        });
      });

      this.logger.warn(`Task ${task.id} escalated to PM level (2h+ overdue)`);
    } else if (hoursOverdue >= 0 && task.escalationLevel === 0) {
      // Level 0 → 1: notify employee
      await this.prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: task.id },
          data: { escalationLevel: 1, escalationNotifiedAt: now },
        });

        await tx.notification.create({
          data: {
            userId: task.assignedTo,
            type: NotificationType.TASK_DELAY_WARNING,
            title: "تذكير: مهمة معلقة",
            message: `المهمة "${task.title}" لم تبدأ بعد`,
            entityId: task.id,
            entityType: "task",
          },
        });
      });

      this.logger.log(
        `Task ${task.id} escalation level 0→1 (employee notified)`,
      );
    }
  }

  /**
   * Every hour: find tasks that are past their dueDate and not DONE,
   * send TASK_OVERDUE notification if not already sent today.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueTasks(): Promise<void> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    try {
      const overdueTasks = await this.prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
          archivedAt: null,
        },
        select: {
          id: true,
          title: true,
          assignedTo: true,
        },
      });

      if (overdueTasks.length === 0) return;

      // Find tasks that already received TASK_OVERDUE notification today
      const alreadyNotifiedTaskIds = await this.prisma.notification
        .findMany({
          where: {
            type: NotificationType.TASK_OVERDUE,
            entityType: "task",
            entityId: { in: overdueTasks.map((t) => t.id) },
            createdAt: { gte: startOfToday },
          },
          select: { entityId: true },
        })
        .then(
          (rows) =>
            new Set(rows.map((r) => r.entityId).filter(Boolean) as string[]),
        );

      const toNotify = overdueTasks.filter(
        (t) => !alreadyNotifiedTaskIds.has(t.id),
      );

      if (toNotify.length === 0) return;

      await this.prisma.notification.createMany({
        data: toNotify.map((task) => ({
          userId: task.assignedTo,
          type: NotificationType.TASK_OVERDUE,
          title: "مهمة متأخرة",
          message: `تجاوزت المهمة "${task.title}" موعد التسليم`,
          entityId: task.id,
          entityType: "task",
        })),
      });

      this.logger.log(
        `Sent TASK_OVERDUE notifications for ${toNotify.length} task(s)`,
      );
    } catch (error) {
      this.logger.error("Overdue tasks cron job failed", error);
    }
  }
}
