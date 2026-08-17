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

const ESCALATION_REMINDER_BIT = 1 << 7;
const DEFAULT_REMINDER_OFFSETS = [5, 3, 0];
const DOWN_PAYMENT_INVOICE_NOTE =
  "Down-payment invoice required to activate the contract";

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
          contractId: { not: null },
        },
        include: {
          client: { select: { userId: true, companyName: true } },
          contract: {
            select: {
              title: true,
              totalValue: true,
              downPaymentType: true,
              downPaymentValue: true,
            },
          },
          paymentPlan: { select: { triggerType: true } },
        },
      });

      for (const invoice of invoices) {
        if (!this.isReminderEligibleContractInvoice(invoice)) continue;
        if ((invoice.reminderFlags & (1 << bitIndex)) !== 0) continue;
        const newFlags = invoice.reminderFlags | (1 << bitIndex);
        const claimed = await this.prisma.invoice.updateMany({
          where: { id: invoice.id, reminderFlags: invoice.reminderFlags },
          data: { reminderFlags: newFlags },
        });
        if (claimed.count === 0) continue;

        const recipientId = invoice.client?.userId;
        if (!recipientId) continue;

        const dayLabel = offsetDay === 0 ? "today" : `in ${offsetDay} day(s)`;
        await this.notificationsService
          .createLocalizedNotification({
            entityId: invoice.id,
            entityType: "INVOICE",
            eventType: "INVOICE_REMINDER",
            userId: recipientId,
            messageKey: "invoice.payment_reminder",
            messageParams: {
              invoiceTitle: invoice.contract?.title ?? invoice.invoiceNumber,
              dayLabel,
              amount: invoice.amount,
            },
          })
          .catch(async () => {
            await this.prisma.invoice.updateMany({
              where: { id: invoice.id, reminderFlags: newFlags },
              data: { reminderFlags: invoice.reminderFlags },
            });
          });
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
          select: {
            id: true,
            title: true,
            createdBy: true,
            client: { select: { userId: true, accountManager: true } },
          },
        },
        period: {
          select: {
            id: true,
            projectId: true,
            project: {
              select: { id: true, status: true, projectManagerId: true },
            },
          },
        },
      },
    });

    for (const invoice of overdueInvoices) {
      if (!invoice.period?.project) continue;
      const project = invoice.period.project;
      if (project.status === "ON_HOLD") continue;

      try {
        const transitioned = await this.prisma.$transaction(async (tx) => {
          const invoiceClaim = await tx.invoice.updateMany({
            where: {
              id: invoice.id,
              triggeredSuspension: false,
              status: {
                in: [
                  InvoiceStatus.DUE,
                  InvoiceStatus.LATE,
                  InvoiceStatus.PENDING,
                ],
              },
            },
            data: { triggeredSuspension: true, status: InvoiceStatus.LATE },
          });
          if (invoiceClaim.count === 0) return false;
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
              changedBy: invoice.contract!.createdBy,
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
              const contractClaim = await tx.contract.updateMany({
                where: { id: invoice.contract.id, status: "ACTIVE" },
                data: { status: "ON_HOLD" },
              });
              if (contractClaim.count === 0) return false;
              await tx.contractStatusHistory.create({
                data: {
                  contractId: invoice.contract.id,
                  fromStatus: "ACTIVE",
                  toStatus: "ON_HOLD",
                  changedBy: invoice.contract.createdBy,
                  reason: "Auto-suspend: overdue period invoice",
                },
              });
            }
          }

          return true;
        });
        if (!transitioned) continue;

        const recipientIds = [
          invoice.contract?.createdBy,
          invoice.contract?.client?.accountManager,
          invoice.contract?.client?.userId,
          project.projectManagerId,
        ].filter(Boolean) as string[];

        if (recipientIds.length > 0) {
          await this.notificationsService
            .notifyUsersWithMessage({
              userIds: recipientIds,
              messageKey: "project.suspended",
              messageParams: {
                invoiceTitle: invoice.contract?.title ?? invoice.invoiceNumber,
              },
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
      },
      include: {
        contract: {
          select: {
            id: true,
            status: true,
            title: true,
            createdBy: true,
            client: { select: { userId: true, accountManager: true } },
            totalValue: true,
            downPaymentType: true,
            downPaymentValue: true,
          },
        },
        paymentPlan: { select: { triggerType: true } },
      },
    });

    for (const invoice of pendingInvoices) {
      if (
        !invoice.contract ||
        invoice.contract.status !== "SIGNED" ||
        !this.isDownPaymentInvoice(invoice)
      )
        continue;

      try {
        const transitioned = await this.prisma.$transaction(async (tx) => {
          const contractClaim = await tx.contract.updateMany({
            where: { id: invoice.contract.id, status: "SIGNED" },
            data: { status: "CANCELLED" },
          });
          if (contractClaim.count === 0) return false;
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: InvoiceStatus.CANCELLED },
          });
          await tx.contractStatusHistory.create({
            data: {
              contractId: invoice.contract.id,
              fromStatus: "SIGNED",
              toStatus: "CANCELLED",
              changedBy: invoice.contract.createdBy,
              reason: "Down payment unpaid past grace period",
            },
          });
          return true;
        });
        if (!transitioned) continue;

        const recipientIds = [
          invoice.contract.createdBy,
          invoice.contract.client?.accountManager,
          invoice.contract.client?.userId,
        ].filter(Boolean) as string[];

        if (recipientIds.length > 0) {
          await this.notificationsService
            .notifyUsersWithMessage({
              userIds: recipientIds,
              messageKey: "contract.auto_canceled",
              messageParams: {
                contractTitle: invoice.contract.title,
                graceDays,
              },
              entityId: invoice.contract.id,
              entityType: "CONTRACT",
              eventType: "CONTRACT_CANCELLED",
            })
            .catch(() => undefined);
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

    const claimedInvoices: typeof overdue = [];
    for (const inv of overdue) {
      if ((inv.reminderFlags & (1 << 7)) !== 0) continue;
      const claim = await this.prisma.invoice.updateMany({
        where: { id: inv.id, reminderFlags: inv.reminderFlags },
        data: { reminderFlags: inv.reminderFlags | ESCALATION_REMINDER_BIT },
      });
      if (claim.count > 0) claimedInvoices.push(inv);
    }
    if (claimedInvoices.length === 0) return;

    await this.notificationsService
      .notifyUsersWithMessage({
        userIds: financeUsers.map((u) => u.id),
        messageKey: "invoice.overdue_escalation",
        messageParams: { count: claimedInvoices.length },
        entityId: "overdue-escalation",
        entityType: "INVOICE",
        eventType: "INVOICE_ESCALATED",
      })
      .catch(async () => {
        for (const inv of claimedInvoices) {
          await this.prisma.invoice.updateMany({
            where: {
              id: inv.id,
              reminderFlags: inv.reminderFlags | ESCALATION_REMINDER_BIT,
            },
            data: { reminderFlags: inv.reminderFlags },
          });
        }
      });

    // The escalation bit is claimed before notification and reset on failure.

    this.logger.log(
      `Escalated ${overdue.length} overdue invoice(s) to finance team`,
    );
  }

  private isReminderEligibleContractInvoice(invoice: any) {
    return Boolean(
      invoice.paymentPlanId || this.isLegacyScalarDownPaymentInvoice(invoice),
    );
  }

  private isDownPaymentInvoice(invoice: any) {
    return Boolean(
      invoice.paymentPlan?.triggerType === PaymentPlanTriggerType.ON_SIGN ||
      this.isLegacyScalarDownPaymentInvoice(invoice),
    );
  }

  private isLegacyScalarDownPaymentInvoice(invoice: any) {
    const contract = invoice.contract;
    if (
      !contract ||
      invoice.paymentPlanId !== null ||
      invoice.notes !== DOWN_PAYMENT_INVOICE_NOTE ||
      !contract.downPaymentType ||
      contract.downPaymentValue == null
    ) {
      return false;
    }

    const amount =
      contract.downPaymentType === "PERCENT"
        ? Math.round(
            contract.totalValue * (contract.downPaymentValue / 100) * 100,
          ) / 100
        : contract.downPaymentValue;
    return amount === invoice.amount;
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
    if (!Array.isArray(val)) return [...DEFAULT_REMINDER_OFFSETS];
    const offsets = [...new Set(val)];
    if (
      offsets.length === 0 ||
      offsets.length > 7 ||
      offsets.some(
        (offset) =>
          typeof offset !== "number" ||
          !Number.isInteger(offset) ||
          !Number.isFinite(offset),
      )
    ) {
      this.logger.warn(
        "Invalid reminder offsets; using defaults to preserve the escalation bit",
      );
      return [...DEFAULT_REMINDER_OFFSETS];
    }
    return offsets;
  }

  private async getGraceDays(): Promise<number> {
    const val = await this.getCompanySetting("down_payment_grace_days");
    return typeof val === "number" ? val : 7;
  }
}
