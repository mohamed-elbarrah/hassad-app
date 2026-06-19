import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { FinanceService } from "../../finance/services/finance.service";
import { ProjectPeriodStatus, ContractType, PaymentPlanTriggerType } from "@hassad/shared";
import type { Prisma } from "@prisma/client";

/**
 * ProjectPeriodsService — the monthly delivery/billing unit (Option 1, Phase 2).
 *
 * A retainer project is sliced into `ProjectPeriod`s (~one month each), anchored
 * to the contract start date's day-of-month. Periods drive the client-facing
 * timeline, the PM summary/report, and (Phase 3) recurring invoicing + suspend.
 *
 * Date rule (locked): anniversary-based with end-of-month clamping that RETURNS
 * to the original day. start 31/01 → period 1 = 31/01–28/02, period 2 = 01/03–31/03
 * (day 31 restored), period 3 = 01/04–30/04 …
 */
@Injectable()
export class ProjectPeriodsService {
  private readonly logger = new Logger(ProjectPeriodsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private financeService: FinanceService,
  ) {}

  // ── Date math ───────────────────────────────────────────────────────────────

  /** Number of days in a given (year, month) where month is 0-indexed. */
  private daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Add `months` to `base`, landing on `originalDay` when the target month has
   * enough days, otherwise clamping to the last day of the target month. The
   * original day is always retried on subsequent calls (no permanent drift).
   */
  private addAnniversaryMonths(base: Date, months: number, originalDay: number): Date {
    const total = base.getMonth() + months;
    const year = base.getFullYear() + Math.floor(total / 12);
    const month = ((total % 12) + 12) % 12;
    const day = Math.min(originalDay, this.daysInMonth(year, month));
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  /** End of the day immediately before `nextStart` (23:59:59.999). */
  private endOfPreviousDay(nextStart: Date): Date {
    const e = new Date(nextStart.getTime() - 1);
    return e;
  }

  // ── Generation ──────────────────────────────────────────────────────────────

  /**
   * Generate periods for a retainer project.
   *  - Bounded: `contract.numberOfMonths` (or endDate-derived) → all periods at once.
   *  - Rolling (indefinite): current + next (roll forward on close — Phase 3 cron).
   * Idempotent: skips if periods already exist for the project.
   */
  async generatePeriods(projectId: string, actorId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { contract: { select: { id: true, type: true, startDate: true, endDate: true, numberOfMonths: true } } },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (project.contract?.type !== ContractType.MONTHLY_RETAINER) {
      // Only retainers get periods. Fixed/one-off projects stay as a single unit.
      return [];
    }

    const existing = await this.prisma.projectPeriod.findFirst({
      where: { projectId },
      select: { id: true },
    });
    if (existing) return this.listPeriods(projectId);

    const startDate = project.contract?.startDate ?? project.startDate;
    const originalDay = startDate.getDate();
    const count = this.resolvePeriodCount(project.contract?.numberOfMonths ?? null, startDate, project.contract?.endDate ?? null);

    const now = new Date();
    const periods: { id: string; periodNumber: number; startDate: Date; endDate: Date }[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < count; i++) {
        const start = this.addAnniversaryMonths(startDate, i, originalDay);
        const nextStart = this.addAnniversaryMonths(startDate, i + 1, originalDay);
        const end = this.endOfPreviousDay(nextStart);

        const created = await tx.projectPeriod.create({
          data: {
            projectId,
            periodNumber: i + 1,
            startDate: start,
            endDate: end,
            status: ProjectPeriodStatus.UPCOMING,
          },
        });
        periods.push({ id: created.id, periodNumber: created.periodNumber, startDate: start, endDate: end });
      }

      // Open the first period if its start date has arrived (project just activated).
      const first = periods[0];
      if (first && first.startDate.getTime() <= now.getTime()) {
        await tx.projectPeriod.update({
          where: { id: first.id },
          data: { status: ProjectPeriodStatus.ACTIVE },
        });
        await this.recordPeriodStatusHistory(
          tx,
          first.id,
          ProjectPeriodStatus.UPCOMING,
          ProjectPeriodStatus.ACTIVE,
          actorId,
          "Project activated — period 1 opened",
        );
      }
    });

    if (periods.length > 0) {
      this.notificationsService
        .notifyUsers({
          userIds: [project.projectManagerId].filter(Boolean) as string[],
          title: "تم توليد فترات المشروع",
          message: `تم إنشاء ${periods.length} فترة شهرية للمشروع "${project.name}".`,
          entityId: projectId,
          entityType: "PROJECT_PERIOD",
          eventType: "PERIODS_GENERATED",
        })
        .catch(() => undefined);
    }

    return this.listPeriods(projectId);
  }

  /** Bounded → numberOfMonths (or months between start and end); rolling → 2. */
  private resolvePeriodCount(numberOfMonths: number | null, startDate: Date, endDate: Date | null): number {
    if (numberOfMonths && numberOfMonths > 0) return numberOfMonths;
    if (endDate) {
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth()) +
        (endDate.getDate() >= startDate.getDate() ? 1 : 0);
      return Math.max(1, months);
    }
    return 2; // rolling: current + next
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  async listPeriods(projectId: string) {
    await this.assertProjectExists(projectId);
    return this.prisma.projectPeriod.findMany({
      where: { projectId },
      orderBy: { periodNumber: "asc" },
    });
  }

  /** The period currently ACTIVE for a project (used to auto-link new work). */
  async getActivePeriod(projectId: string) {
    return this.prisma.projectPeriod.findFirst({
      where: { projectId, status: ProjectPeriodStatus.ACTIVE },
      orderBy: { periodNumber: "asc" },
    });
  }

  async getActivePeriodId(projectId: string): Promise<string | null> {
    const p = await this.getActivePeriod(projectId);
    return p?.id ?? null;
  }

  /** Aggregate period detail: tasks by status, deliverables, files, campaigns/KPIs, summary. */
  async getPeriodDetail(periodId: string) {
    const period = await this.prisma.projectPeriod.findUnique({
      where: { id: periodId },
      include: {
        tasks: { select: { id: true, title: true, status: true, assignedTo: true, dueDate: true }, orderBy: { createdAt: "desc" } },
        deliverables: { select: { id: true, title: true, status: true, isVisibleToClient: true }, orderBy: { createdAt: "desc" } },
        files: { select: { id: true, fileName: true, fileType: true, fileSize: true, uploadedAt: true }, orderBy: { uploadedAt: "desc" } },
        campaigns: { select: { id: true, name: true, platform: true, status: true } },
        kpiSnapshots: { select: { id: true, impressions: true, clicks: true, conversions: true, revenue: true, roas: true, recordedAt: true }, orderBy: { recordedAt: "desc" } },
        statusHistory: { orderBy: { changedAt: "desc" }, take: 20, include: { changedByUser: { select: { id: true, name: true } } } },
        invoice: { select: { id: true, invoiceNumber: true, amount: true, status: true } },
        project: { select: { id: true, clientId: true } },
      },
    });
    if (!period) throw new NotFoundException("Period not found");

    const tasksByStatus = period.tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    }, {});

    // Latest satisfaction rating for the project.
    const latestRating = period.project?.clientId
      ? await this.prisma.satisfactionRating.findFirst({
          where: { projectId: period.project.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, score: true, comment: true, createdAt: true },
        })
      : null;

    return {
      ...period,
      project: undefined,
      tasksByStatus,
      taskCount: period.tasks.length,
      deliverableCount: period.deliverables.length,
      fileCount: period.files.length,
      campaignCount: period.campaigns.length,
      satisfactionRating: latestRating,
    };
  }

  // ── Lifecycle transitions (server-side state machine + history) ──────────────

  /** UPCOMING → ACTIVE. */
  async openPeriod(periodId: string, actorId: string, reason?: string) {
    const period = await this.prisma.projectPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException("Period not found");
    if (period.status === ProjectPeriodStatus.ACTIVE) return period;
    if (period.status !== ProjectPeriodStatus.UPCOMING) {
      throw new BadRequestException(`Period must be UPCOMING to open (current: ${period.status})`);
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectPeriod.update({
        where: { id: periodId },
        data: { status: ProjectPeriodStatus.ACTIVE },
      });
      await this.recordPeriodStatusHistory(tx, periodId, ProjectPeriodStatus.UPCOMING, ProjectPeriodStatus.ACTIVE, actorId, reason ?? "Period opened");
      return updated;
    });
  }

  /**
   * ACTIVE → CLOSED. Sets closedAt, writes history, then opens the next UPCOMING
   * period if its start date has arrived. On close, issues the period invoice
   * from the recurring PERIOD_END plan row (Phase 3).
   */
  async closePeriod(periodId: string, actorId: string, reason?: string) {
    const period = await this.prisma.projectPeriod.findUnique({
      where: { id: periodId },
      include: { project: { select: { id: true, contractId: true, name: true } } },
    });
    if (!period) throw new NotFoundException("Period not found");
    if (period.status === ProjectPeriodStatus.CLOSED) return period;
    if (period.status !== ProjectPeriodStatus.ACTIVE && period.status !== ProjectPeriodStatus.SUSPENDED) {
      throw new BadRequestException(`Period must be ACTIVE or SUSPENDED to close (current: ${period.status})`);
    }

    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectPeriod.update({
        where: { id: periodId },
        data: { status: ProjectPeriodStatus.CLOSED, closedAt: now },
      });
      await this.recordPeriodStatusHistory(tx, periodId, period.status, ProjectPeriodStatus.CLOSED, actorId, reason ?? "Period closed");

      // Open the next period if its start date has arrived.
      const next = await tx.projectPeriod.findFirst({
        where: { projectId: period.project.id, periodNumber: period.periodNumber + 1 },
      });
      if (next && next.status === ProjectPeriodStatus.UPCOMING && next.startDate.getTime() <= now.getTime()) {
        await tx.projectPeriod.update({ where: { id: next.id }, data: { status: ProjectPeriodStatus.ACTIVE } });
        await this.recordPeriodStatusHistory(tx, next.id, ProjectPeriodStatus.UPCOMING, ProjectPeriodStatus.ACTIVE, actorId, "Auto-opened after previous period closed");
      }
      return updated;
    });

    // Phase 3: issue period invoice from the recurring PERIOD_END plan row.
    if (period.project.contractId) {
      await this.issuePeriodInvoice(period, now, actorId).catch((err) => {
        this.logger.error(`Failed to issue period invoice for ${periodId}: ${err?.message}`);
      });
    }

    // Phase 4: notify PM + client that the period closed.
    const projectWithUsers = await this.prisma.project.findUnique({
      where: { id: period.project.id },
      select: { projectManagerId: true, client: { select: { userId: true } } },
    });
    const notifyIds = [
      projectWithUsers?.projectManagerId,
      projectWithUsers?.client?.userId,
    ].filter(Boolean) as string[];
    if (notifyIds.length > 0) {
      this.notificationsService
        .notifyUsers({
          userIds: notifyIds,
          title: "تم إغلاق الفترة",
          message: `تم إغلاق الفترة رقم ${period.periodNumber} للمشروع "${period.project.name}".`,
          entityId: period.id,
          entityType: "PROJECT_PERIOD",
          eventType: "PERIOD_CLOSED",
        })
        .catch(() => undefined);
    }

    return result;
  }

  /** Issue the monthly recurring invoice for a closed period. */
  private async issuePeriodInvoice(
    period: any,
    now: Date,
    actorId: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: period.project.contractId },
      select: { id: true, totalValue: true, title: true },
    });
    if (!contract) return;

    const planRow = await this.prisma.contractPaymentPlan.findFirst({
      where: {
        contractId: contract.id,
        triggerType: PaymentPlanTriggerType.PERIOD_END,
        isRecurring: true,
        isActive: true,
      },
    });
    if (!planRow) return;

    const amount =
      planRow.amountType === "PERCENT"
        ? (contract.totalValue * planRow.amountValue) / 100
        : planRow.amountValue;

    const nextPeriod = await this.prisma.projectPeriod.findFirst({
      where: { projectId: period.project.id, periodNumber: period.periodNumber + 1 },
      orderBy: { periodNumber: "asc" },
    });
    const dueDate = nextPeriod?.startDate ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await this.financeService.generateScheduledInvoice({
      contractId: contract.id,
      paymentPlanId: planRow.id,
      amount,
      label: `الدفعة الشهرية — الفترة ${period.periodNumber}`,
      issueDate: period.endDate,
      dueDate,
      userId: actorId,
      projectId: period.project.id,
      notes: `فاتورة الفترة ${period.periodNumber} للعقد "${contract.title}"`,
    });

    await this.prisma.projectPeriod.update({
      where: { id: period.id },
      data: { invoiceId: invoice.id },
    });

    // Notify client that the period invoice has been issued.
    const projectWithClient = await this.prisma.project.findUnique({
      where: { id: period.project.id },
      select: { client: { select: { userId: true } }, projectManagerId: true },
    });
    const notifyForInvoice = [
      projectWithClient?.projectManagerId,
      projectWithClient?.client?.userId,
    ].filter(Boolean) as string[];
    if (notifyForInvoice.length > 0) {
      this.notificationsService
        .notifyUsers({
          userIds: notifyForInvoice,
          title: "تم إصدار فاتورة الفترة",
          message: `تم إصدار فاتورة الفترة رقم ${period.periodNumber} بقيمة ${amount} ر.س`,
          entityId: invoice.id,
          entityType: "INVOICE",
          eventType: "INVOICE_ISSUED",
        })
        .catch(() => undefined);
    }
  }

  /** Push a period's end date later (PM extend). Must be after the current end. */
  async extendPeriod(periodId: string, newEndDate: string, actorId: string) {
    const period = await this.prisma.projectPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException("Period not found");
    const end = new Date(newEndDate);
    end.setHours(23, 59, 59, 999);
    if (end.getTime() <= period.endDate.getTime()) {
      throw new BadRequestException("New end date must be after the current end date");
    }
    return this.prisma.projectPeriod.update({
      where: { id: periodId },
      data: { endDate: end },
    });
  }

  /** Append a new UPCOMING period after the last one (PM extra period). */
  async createExtraPeriod(projectId: string, actorId: string) {
    const project = await this.assertProjectExists(projectId);
    const last = await this.prisma.projectPeriod.findFirst({
      where: { projectId },
      orderBy: { periodNumber: "desc" },
    });
    if (!last) throw new BadRequestException("No periods exist yet for this project");

    const contract = await this.prisma.contract.findUnique({
      where: { id: project.contractId ?? undefined },
      select: { startDate: true },
    });
    const baseStart = contract?.startDate ?? project.startDate;
    const originalDay = baseStart.getDate();

    // Start = day after the last period's end; preserve the anniversary day-of-month.
    const nextStart = this.addAnniversaryMonths(baseStart, last.periodNumber, originalDay);
    const nextNextStart = this.addAnniversaryMonths(baseStart, last.periodNumber + 1, originalDay);
    const end = this.endOfPreviousDay(nextNextStart);

    return this.prisma.projectPeriod.create({
      data: {
        projectId,
        periodNumber: last.periodNumber + 1,
        startDate: nextStart,
        endDate: end,
        status: ProjectPeriodStatus.UPCOMING,
      },
    });
  }

  // ── PM summary / report / completion ────────────────────────────────────────

  async saveSummary(periodId: string, summary: string) {
    await this.findPeriodOrThrow(periodId);
    return this.prisma.projectPeriod.update({
      where: { id: periodId },
      data: { summary },
    });
  }

  async setCompletion(periodId: string, completionPercentage: number) {
    await this.findPeriodOrThrow(periodId);
    const pct = Math.max(0, Math.min(100, completionPercentage));
    return this.prisma.projectPeriod.update({
      where: { id: periodId },
      data: { completionPercentage: pct },
    });
  }

  async saveReport(periodId: string, reportFilePath: string) {
    await this.findPeriodOrThrow(periodId);
    return this.prisma.projectPeriod.update({
      where: { id: periodId },
      data: { reportFilePath },
    });
  }

  // ── Domain event: generate periods when a retainer contract activates ──────

  @OnEvent("contract.activated")
  async handleContractActivated(payload: {
    contractId: string;
    projectId?: string | null;
    contractType?: string;
    userId?: string;
  }) {
    if (payload.contractType !== ContractType.MONTHLY_RETAINER) return;
    if (!payload.projectId) {
      // Resolve the project for the contract if not provided.
      const project = await this.prisma.project.findFirst({
        where: { contractId: payload.contractId },
        select: { id: true },
      });
      if (!project) return;
      payload.projectId = project.id;
    }
    const actorId = payload.userId || (await this.prisma.contract.findUnique({ where: { id: payload.contractId }, select: { createdBy: true } }))?.createdBy || "system";
    await this.generatePeriods(payload.projectId, actorId).catch((err) => {
      this.logger.error(`Failed to generate periods for project ${payload.projectId}: ${err?.message}`);
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async assertProjectExists(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true, contractId: true, startDate: true, name: true } });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  private async findPeriodOrThrow(periodId: string) {
    const period = await this.prisma.projectPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException("Period not found");
    return period;
  }

  private async recordPeriodStatusHistory(
    tx: Prisma.TransactionClient,
    periodId: string,
    fromStatus: any,
    toStatus: any,
    changedBy: string,
    reason?: string,
  ) {
    return tx.projectPeriodHistory.create({
      data: { periodId, fromStatus, toStatus, changedBy, reason },
    });
  }
}