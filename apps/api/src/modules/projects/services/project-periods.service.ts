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
import { StorageService } from "../../../common/storage/storage.service";
import {
  ProjectPeriodStatus,
  ContractType,
  PaymentPlanTriggerType,
  InvoiceStatus,
} from "@hassad/shared";
import type { Prisma } from "@prisma/client";

/**
 * ProjectPeriodsService — project delivery periods and retainer billing units.
 *
 * Monthly retainers are split into anniversary-based periods. Fixed projects
 * receive one period spanning the contract dates. Periods drive the PM
 * workspace; recurring invoicing remains specific to retainer contracts.
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
    private storageService: StorageService,
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
  private addAnniversaryMonths(
    base: Date,
    months: number,
    originalDay: number,
  ): Date {
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
   * Ensure contract-defined periods exist. Fixed projects receive one period
   * spanning the contract dates; retainers receive monthly periods.
   */
  async generatePeriods(projectId: string, actorId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contract: {
          select: {
            id: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            numberOfMonths: true,
          },
        },
      },
    });
    if (!project) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        details: { projectId },
      });
    }
    if (!project.contract) return [];
    if (
      project.contract.type !== ContractType.MONTHLY_RETAINER &&
      project.contract.type !== ContractType.FIXED_PROJECT
    ) {
      return [];
    }

    const startDate = project.contract.startDate;
    const isFixedProject = project.contract.type === ContractType.FIXED_PROJECT;
    if (
      isFixedProject &&
      (!(["SIGNED", "ACTIVE", "ON_HOLD"] as string[]).includes(
        project.contract.status,
      ) ||
        ["COMPLETED", "CANCELLED"].includes(project.status))
    ) {
      return [];
    }
    const fixedInitialStatus =
      project.contract.status === "ON_HOLD" || project.status === "ON_HOLD"
        ? ProjectPeriodStatus.SUSPENDED
        : ["SIGNED", "ACTIVE"].includes(project.contract.status) &&
            ["ACTIVE", "AWAITING_REVIEW", "NEEDS_REVISION"].includes(
              project.status,
            ) &&
            startDate.getTime() <= Date.now()
          ? ProjectPeriodStatus.ACTIVE
          : ProjectPeriodStatus.UPCOMING;
    const count = isFixedProject
      ? 1
      : this.resolvePeriodCount(
          project.contract.numberOfMonths,
          startDate,
          project.contract.endDate,
        );

    const now = new Date();
    const periods: {
      id: string;
      periodNumber: number;
      startDate: Date;
      endDate: Date;
    }[] = [];

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT true AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${projectId}))) AS advisory_lock`;
      const existing = await tx.projectPeriod.findFirst({
        where: { projectId },
        orderBy: { periodNumber: "asc" },
        select: { id: true, status: true },
      });
      if (existing) {
        const shouldSyncFixedStatus =
          isFixedProject &&
          existing.status !== fixedInitialStatus &&
          ((existing.status === ProjectPeriodStatus.UPCOMING &&
            fixedInitialStatus !== ProjectPeriodStatus.UPCOMING) ||
            (existing.status === ProjectPeriodStatus.ACTIVE &&
              fixedInitialStatus === ProjectPeriodStatus.SUSPENDED) ||
            (existing.status === ProjectPeriodStatus.SUSPENDED &&
              fixedInitialStatus === ProjectPeriodStatus.ACTIVE));
        if (shouldSyncFixedStatus) {
          await tx.projectPeriod.update({
            where: { id: existing.id },
            data: {
              status: fixedInitialStatus,
              suspendedAt:
                fixedInitialStatus === ProjectPeriodStatus.SUSPENDED
                  ? now
                  : null,
              resumedAt:
                existing.status === ProjectPeriodStatus.SUSPENDED &&
                fixedInitialStatus === ProjectPeriodStatus.ACTIVE
                  ? now
                  : undefined,
            },
          });
          await this.recordPeriodStatusHistory(
            tx,
            existing.id,
            existing.status,
            fixedInitialStatus,
            actorId,
            "FIXED_PROJECT_PERIOD_STATUS_SYNCED",
          );
        }
        return;
      }

      for (let i = 0; i < count; i++) {
        const periodStart = isFixedProject
          ? project.contract!.startDate
          : this.addAnniversaryMonths(startDate, i, startDate.getDate());
        const periodEnd = isFixedProject
          ? project.contract!.endDate
          : this.endOfPreviousDay(
              this.addAnniversaryMonths(startDate, i + 1, startDate.getDate()),
            );
        if (periodEnd < periodStart) {
          throw new BadRequestException({
            code: "INVALID_CONTRACT_PERIOD_DATES",
            details: { projectId },
          });
        }

        const created = await tx.projectPeriod.create({
          data: {
            projectId,
            periodNumber: i + 1,
            startDate: periodStart,
            endDate: periodEnd,
            status: isFixedProject
              ? fixedInitialStatus
              : ProjectPeriodStatus.UPCOMING,
            suspendedAt:
              isFixedProject &&
              fixedInitialStatus === ProjectPeriodStatus.SUSPENDED
                ? now
                : undefined,
          },
        });
        periods.push({
          id: created.id,
          periodNumber: created.periodNumber,
          startDate: periodStart,
          endDate: periodEnd,
        });
      }

      // Fixed-period status mirrors the project/contract lifecycle at creation.
      const first = periods[0];
      if (
        isFixedProject &&
        first &&
        fixedInitialStatus !== ProjectPeriodStatus.UPCOMING
      ) {
        await this.recordPeriodStatusHistory(
          tx,
          first.id,
          ProjectPeriodStatus.UPCOMING,
          fixedInitialStatus,
          actorId,
          "FIXED_PROJECT_PERIOD_INITIALIZED",
        );
      } else if (first && first.startDate.getTime() <= now.getTime()) {
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
          "PROJECT_ACTIVATED_PERIOD_OPENED",
        );
      }
    });

    if (periods.length > 0) {
      this.notificationsService
        .notifyUsers({
          userIds: [project.projectManagerId].filter(Boolean) as string[],
          metadata: {
            projectId,
            projectName: project.name,
            periodCount: periods.length,
          },
          entityId: projectId,
          entityType: "PROJECT_PERIOD",
          eventType: "PERIODS_GENERATED",
        })
        .catch(() => undefined);
    }

    return this.listPeriods(projectId);
  }

  /** Bounded → numberOfMonths (or months between start and end); rolling → 2. */
  private resolvePeriodCount(
    numberOfMonths: number | null,
    startDate: Date,
    endDate: Date | null,
  ): number {
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
      include: {
        meetings: {
          orderBy: { scheduledAt: "asc" },
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            durationMin: true,
            location: true,
            meetingLink: true,
            status: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
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
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            assignedTo: true,
            dueDate: true,
          },
          orderBy: { createdAt: "desc" },
        },
        deliverables: {
          select: {
            id: true,
            title: true,
            status: true,
            isVisibleToClient: true,
          },
          orderBy: { createdAt: "desc" },
        },
        files: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "desc" },
        },
        campaigns: {
          select: { id: true, name: true, platform: true, status: true },
        },
        kpiSnapshots: {
          select: {
            id: true,
            impressions: true,
            clicks: true,
            conversions: true,
            revenue: true,
            roas: true,
            recordedAt: true,
          },
          orderBy: { recordedAt: "desc" },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
          take: 20,
          include: { changedByUser: { select: { id: true, name: true } } },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, amount: true, status: true },
        },
        project: { select: { id: true, clientId: true } },
        meetings: {
          orderBy: { scheduledAt: "asc" },
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            durationMin: true,
            location: true,
            meetingLink: true,
            status: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    if (!period) {
      throw new NotFoundException({
        code: "PROJECT_PERIOD_NOT_FOUND",
        details: { periodId },
      });
    }

    const tasksByStatus = period.tasks.reduce<Record<string, number>>(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {},
    );

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
    const period = await this.prisma.projectPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      throw new NotFoundException({
        code: "PROJECT_PERIOD_NOT_FOUND",
        details: { periodId },
      });
    }
    if (period.status === ProjectPeriodStatus.ACTIVE) return period;
    if (period.status !== ProjectPeriodStatus.UPCOMING) {
      throw new BadRequestException({
        code: "PROJECT_PERIOD_CANNOT_BE_OPENED",
        details: { status: period.status },
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectPeriod.update({
        where: { id: periodId },
        data: { status: ProjectPeriodStatus.ACTIVE },
      });
      await this.recordPeriodStatusHistory(
        tx,
        periodId,
        ProjectPeriodStatus.UPCOMING,
        ProjectPeriodStatus.ACTIVE,
        actorId,
        reason ?? "PROJECT_PERIOD_OPENED",
      );
      return updated;
    });
  }

  /**
   * ACTIVE → CLOSED. Sets closedAt, writes history, then opens the next UPCOMING
   * period if its start date has arrived. On close, issues the period invoice
   * from the recurring PERIOD_END plan row (Phase 3).
   */
  async closePeriod(periodId: string, actorId: string, reason?: string) {
    const now = new Date();
    let alreadyClosed = false;
    const period = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT true AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${periodId}))) AS advisory_lock`;
      const current = await tx.projectPeriod.findUnique({
        where: { id: periodId },
        include: {
          project: { select: { id: true, contractId: true, name: true } },
        },
      });
      if (!current) {
        throw new NotFoundException({
          code: "PROJECT_PERIOD_NOT_FOUND",
          details: { periodId },
        });
      }
      if (current.status === ProjectPeriodStatus.CLOSED) {
        alreadyClosed = true;
        return current;
      }
      if (
        current.status !== ProjectPeriodStatus.ACTIVE &&
        current.status !== ProjectPeriodStatus.SUSPENDED
      ) {
        throw new BadRequestException({
          code: "PROJECT_PERIOD_CANNOT_BE_CLOSED",
          details: { status: current.status },
        });
      }

      await tx.projectPeriod.update({
        where: { id: periodId },
        data: { status: ProjectPeriodStatus.CLOSED, closedAt: now },
      });
      await this.recordPeriodStatusHistory(
        tx,
        periodId,
        current.status,
        ProjectPeriodStatus.CLOSED,
        actorId,
        reason ?? "PROJECT_PERIOD_CLOSED",
      );

      const next = await tx.projectPeriod.findFirst({
        where: {
          projectId: current.project.id,
          periodNumber: current.periodNumber + 1,
        },
      });
      if (
        next &&
        next.status === ProjectPeriodStatus.UPCOMING &&
        next.startDate.getTime() <= now.getTime()
      ) {
        await tx.projectPeriod.update({
          where: { id: next.id },
          data: { status: ProjectPeriodStatus.ACTIVE },
        });
        await this.recordPeriodStatusHistory(
          tx,
          next.id,
          ProjectPeriodStatus.UPCOMING,
          ProjectPeriodStatus.ACTIVE,
          actorId,
          "PROJECT_PERIOD_AUTO_OPENED_AFTER_PREVIOUS_CLOSED",
        );
      }

      return {
        ...current,
        status: ProjectPeriodStatus.CLOSED,
        closedAt: now,
      };
    });

    if (alreadyClosed) return period;

    if (period.project.contractId) {
      await this.issuePeriodInvoice(period, now, actorId).catch((error) => {
        this.logger.error(
          `Failed to issue period invoice for ${periodId}: ${error?.message}`,
        );
      });
    }

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
          metadata: {
            projectId: period.project.id,
            projectName: period.project.name,
            periodId: period.id,
            periodNumber: period.periodNumber,
          },
          entityId: period.id,
          entityType: "PROJECT_PERIOD",
          eventType: "PERIOD_CLOSED",
        })
        .catch(() => undefined);
    }

    return period;
  }

  /** Issue the monthly recurring invoice for a closed period. */
  private async issuePeriodInvoice(period: any, now: Date, actorId: string) {
    if (period.invoiceId) return;

    const contract = await this.prisma.contract.findUnique({
      where: { id: period.project.contractId },
      select: {
        id: true,
        type: true,
        totalValue: true,
        title: true,
      },
    });
    if (!contract || contract.type !== ContractType.MONTHLY_RETAINER) return;

    if (
      period.periodNumber === 1 &&
      contract.type === ContractType.MONTHLY_RETAINER
    ) {
      const initialInvoice = await this.prisma.invoice.findFirst({
        where: {
          contractId: contract.id,
          paymentPlan: { triggerType: PaymentPlanTriggerType.ON_SIGN },
          status: { not: InvoiceStatus.CANCELLED },
        },
        select: { id: true },
      });
      if (initialInvoice) {
        // The ON_SIGN invoice covers period 1; do not bill it again.
        return;
      }
    }

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
      where: {
        projectId: period.project.id,
        periodNumber: period.periodNumber + 1,
      },
      orderBy: { periodNumber: "asc" },
    });
    const dueDate =
      nextPeriod?.startDate ??
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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

    // The invoice remains internal until Finance explicitly sends it. Client
    // notification and the corresponding payment action are emitted by
    // FinanceService.sendInvoice().
  }

  /** Push a period's end date later (PM extend). Must be after the current end. */
  async extendPeriod(periodId: string, newEndDate: string, _actorId: string) {
    const period = await this.prisma.projectPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      throw new NotFoundException({
        code: "PROJECT_PERIOD_NOT_FOUND",
        details: { periodId },
      });
    }
    const end = new Date(newEndDate);
    end.setHours(23, 59, 59, 999);
    if (end.getTime() <= period.endDate.getTime()) {
      throw new BadRequestException({
        code: "PROJECT_PERIOD_END_DATE_MUST_BE_EXTENDED",
        details: { periodId },
      });
    }
    return this.prisma.projectPeriod.update({
      where: { id: periodId },
      data: { endDate: end },
    });
  }

  /** Append a new UPCOMING period after the last one (PM extra period). */
  async createExtraPeriod(projectId: string, _actorId: string) {
    const project = await this.assertProjectExists(projectId);
    const contract = project.contractId
      ? await this.prisma.contract.findUnique({
          where: { id: project.contractId },
          select: { type: true, startDate: true },
        })
      : null;
    if (contract?.type === ContractType.FIXED_PROJECT) {
      throw new BadRequestException({
        code: "FIXED_PROJECT_PERIOD_LIMIT_REACHED",
        details: { projectId },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT true AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${projectId}))) AS advisory_lock`;
      const last = await tx.projectPeriod.findFirst({
        where: { projectId },
        orderBy: { periodNumber: "desc" },
      });
      if (!last) {
        throw new BadRequestException({
          code: "PROJECT_PERIOD_NOT_GENERATED",
          details: { projectId },
        });
      }

      const baseStart = contract?.startDate ?? project.startDate;
      const originalDay = baseStart.getDate();
      const nextStart = this.addAnniversaryMonths(
        baseStart,
        last.periodNumber,
        originalDay,
      );
      const nextNextStart = this.addAnniversaryMonths(
        baseStart,
        last.periodNumber + 1,
        originalDay,
      );
      const end = this.endOfPreviousDay(nextNextStart);

      return tx.projectPeriod.create({
        data: {
          projectId,
          periodNumber: last.periodNumber + 1,
          startDate: nextStart,
          endDate: end,
          status: ProjectPeriodStatus.UPCOMING,
        },
      });
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

  /** Presigned download URL for a period's report file (PM view). */
  async getReportDownloadUrl(periodId: string) {
    const period = await this.prisma.projectPeriod.findUnique({
      where: { id: periodId },
      select: { reportFilePath: true },
    });
    if (!period || !period.reportFilePath) {
      throw new NotFoundException({
        code: "PROJECT_PERIOD_REPORT_NOT_FOUND",
        details: { periodId },
      });
    }
    return this.storageService.getPresignedUrl(period.reportFilePath);
  }

  /** Save PM-defined goals for this period (visible to client). */
  async saveGoals(
    periodId: string,
    goals: Array<{
      title: string;
      description?: string;
      progress: number;
      status: string;
    }>,
  ) {
    await this.findPeriodOrThrow(periodId);
    const normalized = goals.map((g) => ({
      title: g.title,
      description: g.description ?? null,
      progress: Math.max(0, Math.min(100, g.progress ?? 0)),
      status: ["done", "in_progress", "pending"].includes(g.status)
        ? g.status
        : g.progress >= 100
          ? "done"
          : g.progress > 0
            ? "in_progress"
            : "pending",
    }));
    return this.prisma.projectPeriod.update({
      where: { id: periodId },
      data: { goals: normalized as any },
    });
  }

  // ── Meetings (PM-scheduled, per-period, visible to client) ───────────────────

  async createMeeting(
    periodId: string,
    actorId: string,
    dto: {
      title: string;
      scheduledAt: string;
      durationMin?: number;
      location?: string;
      meetingLink?: string;
    },
  ) {
    const period = await this.prisma.projectPeriod.findUnique({
      where: { id: periodId },
      select: {
        id: true,
        projectId: true,
        periodNumber: true,
        project: {
          select: { name: true, client: { select: { userId: true } } },
        },
      },
    });
    if (!period) {
      throw new NotFoundException({
        code: "PROJECT_PERIOD_NOT_FOUND",
        details: { periodId },
      });
    }

    const meeting = await this.prisma.projectMeeting.create({
      data: {
        projectId: period.projectId,
        periodId: period.id,
        title: dto.title,
        scheduledAt: new Date(dto.scheduledAt),
        durationMin: dto.durationMin ?? null,
        location: dto.location ?? null,
        meetingLink: dto.meetingLink ?? null,
        status: "SCHEDULED",
        createdBy: actorId,
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    const clientUserId = period.project?.client?.userId;
    if (clientUserId) {
      this.notificationsService
        .notifyUsers({
          userIds: [clientUserId],
          metadata: {
            meetingId: meeting.id,
            meetingTitle: dto.title,
            periodNumber: period.periodNumber,
            projectName: period.project?.name,
          },
          entityId: meeting.id,
          entityType: "PROJECT_MEETING",
          eventType: "MEETING_SCHEDULED",
        })
        .catch(() => undefined);
    }

    return meeting;
  }

  async updateMeeting(
    meetingId: string,
    actorId: string,
    dto: {
      title?: string;
      scheduledAt?: string;
      durationMin?: number;
      location?: string;
      meetingLink?: string;
      status?: string;
      notes?: string;
    },
  ) {
    const existing = await this.prisma.projectMeeting.findUnique({
      where: { id: meetingId },
      include: {
        period: {
          select: {
            periodNumber: true,
            project: {
              select: { name: true, client: { select: { userId: true } } },
            },
          },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "PROJECT_MEETING_NOT_FOUND",
        details: { meetingId },
      });
    }

    const wasRescheduled =
      dto.scheduledAt &&
      new Date(dto.scheduledAt).getTime() !== existing.scheduledAt.getTime();

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.scheduledAt !== undefined)
      data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMin !== undefined) data.durationMin = dto.durationMin;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.meetingLink !== undefined) data.meetingLink = dto.meetingLink;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) {
      this.assertMeetingTransition(existing.status, dto.status);
      // Rescheduling keeps the row but flips status to RESCHEDULED until the PM
      // confirms the new time (client sets it back to SCHEDULED via update).
      data.status = dto.status;
    }

    const updated = await this.prisma.projectMeeting.update({
      where: { id: meetingId },
      data,
      include: { creator: { select: { id: true, name: true } } },
    });

    const clientUserId = existing.period?.project?.client?.userId;
    if (clientUserId) {
      const eventType =
        dto.status === "CANCELLED"
          ? "MEETING_CANCELLED"
          : wasRescheduled
            ? "MEETING_RESCHEDULED"
            : dto.status === "DONE"
              ? "MEETING_DONE"
              : "MEETING_UPDATED";
      this.notificationsService
        .notifyUsers({
          userIds: [clientUserId],
          metadata: {
            meetingId,
            meetingTitle: updated.title,
            periodNumber: existing.period?.periodNumber,
            projectName: existing.period?.project?.name,
          },
          entityId: meetingId,
          entityType: "PROJECT_MEETING",
          eventType,
        })
        .catch(() => undefined);
    }

    return updated;
  }

  // ── Domain event: generate periods when a retainer contract activates ──────

  @OnEvent("contract.activated")
  async handleContractActivated(payload: {
    contractId: string;
    projectId?: string | null;
    contractType?: string;
    userId?: string;
  }) {
    if (
      payload.contractType !== ContractType.MONTHLY_RETAINER &&
      payload.contractType !== ContractType.FIXED_PROJECT
    )
      return;
    if (!payload.projectId) {
      // Resolve the project for the contract if not provided.
      const project = await this.prisma.project.findFirst({
        where: { contractId: payload.contractId },
        select: { id: true },
      });
      if (!project) return;
      payload.projectId = project.id;
    }
    const actorId =
      payload.userId ||
      (
        await this.prisma.contract.findUnique({
          where: { id: payload.contractId },
          select: { createdBy: true },
        })
      )?.createdBy ||
      "system";
    await this.generatePeriods(payload.projectId, actorId).catch((err) => {
      this.logger.error(
        `Failed to generate periods for project ${payload.projectId}: ${err?.message}`,
      );
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async assertProjectExists(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, contractId: true, startDate: true, name: true },
    });
    if (!project) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        details: { projectId },
      });
    }
    return project;
  }

  private async findPeriodOrThrow(periodId: string) {
    const period = await this.prisma.projectPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      throw new NotFoundException({
        code: "PROJECT_PERIOD_NOT_FOUND",
        details: { periodId },
      });
    }
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

  /**
   * Allowed meeting transitions. CANCELLED/DONE are terminal unless the PM
   * re-opens by setting SCHEDULED again. RESCHEDULED is an intermediate flag
   * the PM clears by saving a new SCHEDULED time.
   */
  private assertMeetingTransition(from: string, to: string) {
    const terminal = ["DONE", "CANCELLED"];
    if (terminal.includes(from) && to !== "SCHEDULED") {
      throw new BadRequestException({
        code: "PROJECT_MEETING_TRANSITION_NOT_ALLOWED",
        details: { from, to },
      });
    }
  }
}
