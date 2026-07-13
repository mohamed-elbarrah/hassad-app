import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { ClientCounterService } from "../../crm/services/client-counter.service";
import {
  InvoiceStatus,
  ContractStatus,
  ProjectPeriodStatus,
  PaymentPlanTriggerType,
} from "@hassad/shared";
import type { Prisma } from "@prisma/client";

@Injectable()
export class BillingCronService {
  private readonly logger = new Logger(BillingCronService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private clientCounterService: ClientCounterService,
  ) {}

  /**
   * Daily billing engine: reminders, suspension, down-payment auto-cancel.
   * Runs at ~03:00 company time (default Asia/Riyadh).
   */
  @Cron("0 3 * * *")
  async handleBillingCycle() {
    this.logger.log("Starting billing cycle…");
    try {
      await this.sendReminders();
    } catch (err) {
      this.logger.error(`Reminder pass failed: ${(err as Error).message}`);
    }
    try {
      await this.suspendOverdue();
    } catch (err) {
      this.logger.error(`Suspension pass failed: ${(err as Error).message}`);
    }
    try {
      await this.cancelUnpaidDownPayments();
    } catch (err) {
      this.logger.error(
        `Down-payment auto-cancel failed: ${(err as Error).message}`,
      );
    }
    try {
      await this.escalateOverdueInvoices();
    } catch (err) {
      this.logger.error(`Escalation pass failed: ${(err as Error).message}`);
    }
    this.logger.log("Billing cycle complete");
  }

  // ── Reminder pass ────────────────────────────────────────────────────────────

  /** Send invoice reminders at −5, −3, 0 days before due date (bitmask dedup). */
  private async sendReminders() {
    const days = await this.getReminderOffsetDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const offsetDay of days) {
      const targetDate = new Date(
        today.getTime() + offsetDay * 24 * 60 * 60 * 1000,
      );
      targetDate.setHours(0, 0, 0, 0);
      const bitIndex = this.offsetToBitIndex(offsetDay, days);
      if (bitIndex < 0) continue;

      const invoices = await this.prisma.invoice.findMany({
        where: {
          status: {
            in: [InvoiceStatus.DUE, InvoiceStatus.PENDING, InvoiceStatus.SENT],
          },
          dueDate: {
            gte: targetDate,
            lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
          },
          reminderFlags: { not: { gte: 1 << bitIndex } },
          paymentPlanId: { not: null },
        },
        include: {
          client: { select: { userId: true, companyName: true } },
          contract: { select: { title: true } },
        },
      });

      for (const invoice of invoices) {
        const newFlags = invoice.reminderFlags | (1 << bitIndex);
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { reminderFlags: newFlags },
        });

        const recipientId = invoice.client?.userId;
        if (!recipientId) continue;

        const dayLabel = offsetDay === 0 ? "اليوم" : `خلال ${offsetDay} أيام`;
        await this.notificationsService
          .createNotification({
            entityId: invoice.id,
            entityType: "INVOICE",
            eventType: "INVOICE_REMINDER",
            userId: recipientId,
            title: "تذكير بدفع الفاتورة",
            body: `الفاتورة "${invoice.contract?.title ?? invoice.invoiceNumber}" مستحقة ${dayLabel}. يرجى سداد المبلغ ${invoice.amount} ر.س`,
          })
          .catch(() => undefined);
      }
    }
  }

  /** Map an offset day to its bit index (0-indexed in the sorted unique offsets). */
  private offsetToBitIndex(offset: number, offsets: number[]): number {
    const sorted = [...new Set(offsets)].sort((a, b) => b - a);
    const idx = sorted.indexOf(offset);
    return idx >= 0 ? idx : -1;
  }

  // ── Suspension pass ──────────────────────────────────────────────────────────

  /** Suspend project/period for invoices past due date. */
  private async suspendOverdue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: {
          in: [InvoiceStatus.DUE, InvoiceStatus.LATE, InvoiceStatus.PENDING],
        },
        dueDate: { lt: today },
        triggeredSuspension: false,
        contractId: { not: null },
        period: { isNot: null },
      },
      include: {
        contract: {
          select: { id: true, title: true, createdBy: true },
          include: {
            client: { select: { userId: true, accountManager: true } },
          },
        },
        period: {
          select: { id: true, projectId: true },
          include: { project: { select: { id: true, status: true } } },
        },
      },
    });

    for (const invoice of overdueInvoices) {
      if (!invoice.period?.project) continue;
      const project = invoice.period.project;
      if (project.status === "ON_HOLD") continue;

      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.projectPeriod.update({
            where: { id: invoice.period!.id },
            data: {
              status: ProjectPeriodStatus.SUSPENDED,
              suspendedAt: new Date(),
            },
          });
          await tx.projectPeriodHistory.create({
            data: {
              periodId: invoice.period!.id,
              fromStatus: ProjectPeriodStatus.ACTIVE,
              toStatus: ProjectPeriodStatus.SUSPENDED,
              changedBy: "system",
              reason: "Overdue period invoice",
            },
          });

          await tx.project.update({
            where: { id: project.id },
            data: { status: "ON_HOLD" },
          });

          if (invoice.contract) {
            const contract = await tx.contract.findUnique({
              where: { id: invoice.contract.id },
              select: { status: true },
            });
            if (contract && contract.status === "ACTIVE") {
              await tx.contract.update({
                where: { id: invoice.contract.id },
                data: { status: "ON_HOLD" },
              });
              await tx.contractStatusHistory.create({
                data: {
                  contractId: invoice.contract.id,
                  fromStatus: "ACTIVE",
                  toStatus: "ON_HOLD",
                  changedBy: "system",
                  reason: "Auto-suspend: overdue period invoice",
                },
              });
            }
          }

          await tx.invoice.update({
            where: { id: invoice.id },
            data: { triggeredSuspension: true, status: InvoiceStatus.LATE },
          });
        });

        const recipientIds = [
          invoice.contract?.createdBy,
          invoice.contract?.client?.accountManager,
          invoice.contract?.client?.userId,
        ].filter(Boolean) as string[];

        if (recipientIds.length > 0) {
          await this.notificationsService
            .notifyUsers({
              userIds: recipientIds,
              title: "تم تعليق المشروع",
              message: `تم تعليق المشروع بسبب عدم دفع الفاتورة "${invoice.contract?.title ?? invoice.invoiceNumber}". يرجى متابعة السداد لاستئناف العمل.`,
              entityId: project.id,
              entityType: "PROJECT",
              eventType: "PROJECT_SUSPENDED",
            })
            .catch(() => undefined);
        }

        // Refresh the owning client's counters — auto-suspension moves
        // the project from ACTIVE to ON_HOLD, which changes the
        // `activeProjects` bucket on the KPI grid. Fire-and-forget so a
        // counter glitch never aborts the rest of the billing sweep.
        this.clientCounterService
          .onProjectStatusChange(project.id)
          .catch(() => undefined);
      } catch (err) {
        this.logger.error(
          `Failed to suspend for invoice ${invoice.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ── Down-payment auto-cancel ─────────────────────────────────────────────────

  /** Cancel contracts with unpaid down payments past the grace period. */
  private async cancelUnpaidDownPayments() {
    const graceDays = await this.getGraceDays();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - graceDays);
    cutoff.setHours(0, 0, 0, 0);

    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        status: {
          in: [InvoiceStatus.PENDING, InvoiceStatus.DUE, InvoiceStatus.SENT],
        },
        issueDate: { lt: cutoff },
        contractId: { not: null },
        paymentPlan: { triggerType: PaymentPlanTriggerType.ON_SIGN },
      },
      include: {
        contract: {
          select: {
            id: true,
            status: true,
            title: true,
            createdBy: true,
            client: { select: { userId: true, accountManager: true } },
          },
        },
      },
    });

    for (const invoice of pendingInvoices) {
      if (!invoice.contract || invoice.contract.status !== "SIGNED") continue;

      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: InvoiceStatus.CANCELLED },
          });
          await tx.contract.update({
            where: { id: invoice.contract.id },
            data: { status: "CANCELLED" },
          });
          await tx.contractStatusHistory.create({
            data: {
              contractId: invoice.contract.id,
              fromStatus: "SIGNED",
              toStatus: "CANCELLED",
              changedBy: "system",
              reason: "Down payment unpaid past grace period",
            },
          });
        });

        const recipientIds = [
          invoice.contract.createdBy,
          invoice.contract.client?.accountManager,
          invoice.contract.client?.userId,
        ].filter(Boolean) as string[];

        if (recipientIds.length > 0) {
          await this.notificationsService.notifyUsers({
            userIds: recipientIds,
            title: "تم إلغاء العقد تلقائياً",
            message: `تم إلغاء العقد "${invoice.contract.title}" لعدم سداد الدفعة المقدمة خلال ${graceDays} أيام`,
            entityId: invoice.contract.id,
            entityType: "CONTRACT",
            eventType: "CONTRACT_CANCELLED",
          });
        }
      } catch (err) {
        this.logger.error(
          `Failed to auto-cancel down payment for invoice ${invoice.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ── Escalation pass ───────────────────────────────────────────────────────────

  /** Notify finance admins when invoices are 30+ days past due. */
  private async escalateOverdueInvoices() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const overdue = await this.prisma.invoice.findMany({
      where: {
        dueDate: { lt: thirtyDaysAgo },
        status: { in: ["DUE", "LATE", "PENDING", "SENT"] },
        reminderFlags: { not: { gte: 1 << 7 } }, // escalation bit (previously unused high bit)
      },
      include: {
        client: { select: { companyName: true } },
        contract: { select: { title: true } },
      },
    });

    if (overdue.length === 0) return;

    const financeUsers = await this.prisma.user.findMany({
      where: {
        role: { name: { in: ["ADMIN", "FINANCE"] } },
        isActive: true,
      },
      select: { id: true },
    });

    if (financeUsers.length === 0) return;

    await this.notificationsService.notifyUsers({
      userIds: financeUsers.map((u) => u.id),
      title: "فواتير متأخرة +30 يوماً",
      message: `يوجد ${overdue.length} فاتورة متأخرة منذ أكثر من 30 يوماً بحاجة للمتابعة.`,
      entityId: "overdue-escalation",
      entityType: "INVOICE",
      eventType: "INVOICE_ESCALATED",
    });

    // Mark escalation bit so we don't re-alert
    for (const inv of overdue) {
      await this.prisma.invoice.update({
        where: { id: inv.id },
        data: { reminderFlags: inv.reminderFlags | (1 << 7) },
      });
    }

    this.logger.log(
      `Escalated ${overdue.length} overdue invoice(s) to finance team`,
    );
  }

  // ── Company settings ─────────────────────────────────────────────────────────

  private async getCompanySetting(key: string): Promise<any> {
    const setting = await this.prisma.companySetting.findUnique({
      where: { key },
    });
    return setting?.value ?? null;
  }

  private async getReminderOffsetDays(): Promise<number[]> {
    const val = await this.getCompanySetting("reminder_offset_days");
    return Array.isArray(val) ? val : [5, 3, 0];
  }

  private async getGraceDays(): Promise<number> {
    const val = await this.getCompanySetting("down_payment_grace_days");
    return typeof val === "number" ? val : 7;
  }
}
