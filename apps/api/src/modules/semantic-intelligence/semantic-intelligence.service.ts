import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export const MAX_PERIOD_DAYS = 366;
export const MAX_RESULTS = 100;
const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_UTC_TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/;

export interface CanonicalPeriod {
  from: Date;
  to: Date;
  fromIso: string;
  toIso: string;
}
export interface ComparisonValue {
  current: number;
  previous: number;
  delta: number;
  percentChange: number | null;
}

export const METRIC_SEMANTICS = {
  createdCounts:
    "Records whose creation date falls inside the requested period; archive state does not remove them.",
  statusCounts:
    "Current status of records created inside the requested period; this is not an active-record snapshot.",
  activeStatusCounts:
    "Current status of non-archived records, regardless of creation date, evaluated at query time.",
} as const;

/** UTC-only, half-open period parsing and bounded operational aggregates. */
@Injectable()
export class SemanticIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  parsePeriod(input: unknown, name = "period"): CanonicalPeriod {
    if (!input || typeof input !== "object")
      throw this.invalid("INVALID_PERIOD");
    const value = input as Record<string, unknown>;
    const from = this.parseUtc(value.from, `${name}.from`);
    const to = this.parseUtc(value.to, `${name}.to`);
    const range = to.getTime() - from.getTime();
    if (range <= 0) throw this.invalid("PERIOD_ORDER_INVALID");
    if (range > MAX_PERIOD_DAYS * 24 * 60 * 60 * 1000)
      throw this.invalid("PERIOD_RANGE_TOO_LARGE");
    return { from, to, fromIso: from.toISOString(), toIso: to.toISOString() };
  }

  private parseUtc(value: unknown, name: string): Date {
    if (typeof value !== "string" || !value.trim())
      throw this.invalid("PERIOD_DATE_REQUIRED");
    const dateOnly = value.match(ISO_DATE_ONLY);
    const timestamp = value.match(ISO_UTC_TIMESTAMP);
    if (!dateOnly && !timestamp)
      throw this.invalid("PERIOD_DATE_TIMEZONE_REQUIRED");
    const parts = dateOnly
      ? {
          year: Number(dateOnly[1]),
          month: Number(dateOnly[2]),
          day: Number(dateOnly[3]),
          hour: 0,
          minute: 0,
          second: 0,
        }
      : {
          year: Number(timestamp![1]),
          month: Number(timestamp![2]),
          day: Number(timestamp![3]),
          hour: Number(timestamp![4]),
          minute: Number(timestamp![5]),
          second: Number(timestamp![6]),
        };
    if (
      parts.month < 1 ||
      parts.month > 12 ||
      parts.day < 1 ||
      parts.hour > 23 ||
      parts.minute > 59 ||
      parts.second > 59
    ) {
      throw this.invalid("PERIOD_DATE_INVALID");
    }
    const date = new Date(0);
    date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    date.setUTCHours(parts.hour, parts.minute, parts.second, 0);
    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() !== parts.year ||
      date.getUTCMonth() !== parts.month - 1 ||
      date.getUTCDate() !== parts.day
    ) {
      throw this.invalid("PERIOD_DATE_INVALID");
    }
    if (timestamp) {
      const timestampDate = new Date(value);
      if (Number.isNaN(timestampDate.getTime()))
        throw this.invalid("PERIOD_DATE_INVALID");
      return timestampDate;
    }
    return date;
  }

  private invalid(reasonCode: string): BadRequestException {
    return new BadRequestException({
      code: "SEMANTIC_PERIOD_INVALID",
      details: { reasonCode },
    });
  }

  static compare(current: number, previous: number): ComparisonValue {
    const delta = current - previous;
    return {
      current,
      previous,
      delta,
      percentChange: previous === 0 ? null : (delta / previous) * 100,
    };
  }

  async getBusinessOverview(period: CanonicalPeriod, maxResults = MAX_RESULTS) {
    if (
      !Number.isInteger(maxResults) ||
      maxResults < 1 ||
      maxResults > MAX_RESULTS
    )
      throw this.invalid("MAX_RESULTS_INVALID");
    const where = { gte: period.from, lt: period.to };
    const [
      requests,
      requestStatuses,
      clients,
      clientStatuses,
      projects,
      projectStatuses,
      activeProjectsByStatus,
      tasks,
      taskStatuses,
      payments,
      invoices,
      invoiceStatuses,
      campaigns,
      activeCampaignsByStatus,
      paymentCurrencies,
      invoiceCurrencies,
      campaignCurrencies,
    ] = await Promise.all([
      this.prisma.request.count({ where: { createdAt: where } }),
      this.prisma.request.groupBy({
        by: ["status"],
        where: { createdAt: where },
        _count: true,
        orderBy: { status: "asc" },
        take: maxResults,
      }),
      this.prisma.client.count({ where: { createdAt: where } }),
      this.prisma.client.groupBy({
        by: ["status"],
        where: { createdAt: where },
        _count: true,
        orderBy: { status: "asc" },
        take: maxResults,
      }),
      // These are historical creation metrics: current archive state must not erase them.
      this.prisma.project.count({ where: { createdAt: where } }),
      this.prisma.project.groupBy({
        by: ["status"],
        where: { createdAt: where },
        _count: true,
        orderBy: { status: "asc" },
        take: maxResults,
      }),
      this.prisma.project.groupBy({
        by: ["status"],
        where: { isArchived: false },
        _count: true,
        orderBy: { status: "asc" },
        take: maxResults,
      }),
      this.prisma.task.count({ where: { createdAt: where } }),
      this.prisma.task.groupBy({
        by: ["status"],
        where: { createdAt: where },
        _count: true,
        orderBy: { status: "asc" },
        take: maxResults,
      }),
      this.prisma.payment.aggregate({
        where: { date: where, status: "SUCCESS" },
        _count: { _all: true },
      }),
      this.prisma.invoice.aggregate({
        where: { issueDate: where },
        _count: { _all: true },
      }),
      this.prisma.invoice.groupBy({
        by: ["status"],
        where: { issueDate: where },
        _count: true,
        orderBy: { status: "asc" },
        take: maxResults,
      }),
      // Campaign creation history is independent of whether a campaign is archived now.
      this.prisma.campaign.count({ where: { createdAt: where } }),
      this.prisma.campaign.groupBy({
        by: ["status"],
        where: { isArchived: false },
        _count: true,
        orderBy: { status: "asc" },
        take: maxResults,
      }),
      this.prisma.payment.groupBy({
        by: ["currency"],
        where: { date: where, status: "SUCCESS" },
        _count: true,
        _sum: { amount: true },
        orderBy: { currency: "asc" },
        take: maxResults,
      }),
      this.prisma.invoice.groupBy({
        by: ["currency"],
        where: { issueDate: where },
        _count: true,
        _sum: { amount: true },
        orderBy: { currency: "asc" },
        take: maxResults,
      }),
      this.prisma.campaign.groupBy({
        by: ["currency"],
        where: { createdAt: where },
        _count: true,
        _sum: { budgetTotal: true, budgetSpent: true },
        orderBy: { currency: "asc" },
        take: maxResults,
      }),
    ]);
    const currencies = [
      ...new Set([
        ...paymentCurrencies.map((row) => row.currency),
        ...invoiceCurrencies.map((row) => row.currency),
        ...campaignCurrencies.map((row) => row.currency),
      ]),
    ].sort();
    return {
      period: {
        from: period.fromIso,
        to: period.toIso,
        timezone: "UTC",
        interval: "[from,to)",
      },
      limits: { maxRangeDays: MAX_PERIOD_DAYS, maxResults },
      metadata: {
        source: "Prisma operational database aggregates",
        metricSemantics: METRIC_SEMANTICS,
        archivePolicy: {
          createdCounts: "INCLUDE_ARCHIVED_CREATED_IN_PERIOD",
          statusCounts:
            "CURRENT_STATUS_OF_PERIOD_CREATED_RECORDS_INCLUDING_ARCHIVED",
          activeStatusCounts: "NON_ARCHIVED_CURRENT_SNAPSHOT",
        },
        currencyPolicy: {
          mode: "GROUP_BY_CURRENCY",
          conversion: "NONE",
          monetaryComparison: "NOT_INCLUDED",
          mixedCurrency: currencies.length > 1,
          currencies,
        },
      },

      metrics: {
        crm: {
          requestsCreated: requests,
          requestsByStatus: this.group(requestStatuses, maxResults),
          requestsCreatedByCurrentStatus: this.group(
            requestStatuses,
            maxResults,
          ),
        },
        clients: {
          clientsCreated: clients,
          clientsByStatus: this.group(clientStatuses, maxResults),
          clientsCreatedByCurrentStatus: this.group(clientStatuses, maxResults),
        },
        projects: {
          projectsCreated: projects,
          projectsByStatus: this.group(projectStatuses, maxResults),
          historical: {
            createdInPeriod: projects,
            createdInPeriodByCurrentStatus: this.group(
              projectStatuses,
              maxResults,
            ),
            archiveState: "INCLUDED",
          },
          currentSnapshot: {
            activeNowByStatus: this.group(activeProjectsByStatus, maxResults),
            archiveState: "EXCLUDED",
          },
          activeProjectsByStatus: this.group(
            activeProjectsByStatus,
            maxResults,
          ),
        },
        tasks: {
          tasksCreated: tasks,
          tasksByStatus: this.group(taskStatuses, maxResults),
          tasksCreatedByCurrentStatus: this.group(taskStatuses, maxResults),
        },
        finance: {
          successfulPayments: payments._count._all,
          successfulPaymentAmountByCurrency: this.moneyGroup(
            paymentCurrencies,
            maxResults,
          ),
          invoicesIssued: invoices._count._all,
          invoiceAmountIssuedByCurrency: this.moneyGroup(
            invoiceCurrencies,
            maxResults,
          ),
          invoicesByStatus: this.group(invoiceStatuses, maxResults),
          invoicesIssuedByCurrentStatus: this.group(
            invoiceStatuses,
            maxResults,
          ),
        },
        marketing: {
          campaignsCreated: campaigns,
          campaignBudgetByCurrency: this.budgetGroup(
            campaignCurrencies,
            maxResults,
          ),
          historical: { createdInPeriod: campaigns, archiveState: "INCLUDED" },
          currentSnapshot: {
            activeNowByStatus: this.group(activeCampaignsByStatus, maxResults),
            archiveState: "EXCLUDED",
          },
          activeCampaignsByStatus: this.group(
            activeCampaignsByStatus,
            maxResults,
          ),
        },
      },
    };
  }

  private group(
    rows: Array<{ status: string; _count: number }>,
    limit: number,
  ) {
    return rows
      .slice(0, limit)
      .map((row) => ({ status: row.status, count: row._count }));
  }
  private moneyGroup(
    rows: Array<{
      currency: string;
      _count: number;
      _sum: { amount: number | null };
    }>,
    limit: number,
  ) {
    return rows.slice(0, limit).map((row) => ({
      currency: row.currency,
      count: row._count,
      amount: row._sum.amount ?? 0,
    }));
  }
  private budgetGroup(
    rows: Array<{
      currency: string;
      _count: number;
      _sum: { budgetTotal: number | null; budgetSpent: number | null };
    }>,
    limit: number,
  ) {
    return rows.slice(0, limit).map((row) => ({
      currency: row.currency,
      count: row._count,
      budgetTotal: row._sum.budgetTotal ?? 0,
      budgetSpent: row._sum.budgetSpent ?? 0,
    }));
  }
}
