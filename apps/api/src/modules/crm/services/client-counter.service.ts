import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * Owns the denormalized counter fields on the `Client` row.
 *
 * Why denormalized counters:
 *   The portal profile page (`/portal/profile`) renders a KPI grid that
 *   shows "إجمالي المشاريع", "قيمة العقود", etc. Counting these on every
 *   page load by joining 5 tables would be wasteful for a panel that
 *   never reflects live mutations within a single session. We materialize
 *   the aggregates on the `Client` row and refresh them lazily on every
 *   relevant state transition.
 *
 * Invariant:
 *   For every client, the denormalized counter fields MUST equal the
 *   aggregates defined in `aggregateClientCounters()`. Any drift (caused
 *   by manual SQL, a back-port from staging, a missed hook wiring) can
 *   be corrected by running the `backfill-client-counters` script.
 *
 * Single source of truth:
 *   The aggregation + write logic lives in `aggregateClientCounters()`.
 *   `recomputeAll()` is a thin wrapper that adds logging + history-log
 *   side effects on top of it. The backfill script and any future cron
 *   should call `recomputeAll()` (or `aggregateClientCounters()` if they
 *   want to skip the side effects).
 */
@Injectable()
export class ClientCounterService {
  private readonly logger = new Logger(ClientCounterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recompute all counter fields for a single client and write them back.
   * Also writes a `CLIENT_COUNTERS_UPDATED` history log entry so PMs and
   * admins can audit when the counters were last refreshed.
   *
   * Safe to call concurrently for the same client — Prisma's `update` is
   * last-write-wins. The aggregation queries themselves are read-only and
   * not subject to race conditions.
   */
  async recomputeAll(clientId: string): Promise<void> {
    const update = await this.aggregateClientCounters(clientId, this.prisma);

    if (!update) {
      // Client was deleted between the call and the write — nothing to do.
      return;
    }

    await this.prisma.client.update({
      where: { id: clientId },
      data: update,
    });

    // Audit-log write is best-effort. The counter update above is the
    // critical path — it must never be rolled back by an audit-log
    // failure. The history log is wrapped in a try/catch with a silent
    // fallback so a missing system user, a constraint violation, or any
    // other audit-log glitch can never abort the recompute. This matches
    // the codebase convention: "a notification failure must never roll
    // back business data."
    try {
      const systemUserId = await this.resolveSystemUserId();
      await this.prisma.clientHistoryLog.create({
        data: {
          clientId,
          userId: systemUserId,
          eventType: "CLIENT_COUNTERS_UPDATED",
          description: "Client counters recomputed",
        },
      });
    } catch {
      // Silent — audit-log failure is non-critical. The counter write
      // above already succeeded and is the source of truth for the portal
      // KPI grid.
    }

    this.logger.log(`Recomputed counters for client ${clientId}`);
  }

  /**
   * Resolve the user ID that should be recorded as the actor on automated
   * counter recomputes. We use the first active admin user, mirroring the
   * pattern already established in `disputes.scheduler.ts`. In a seeded
   * dev environment this is the `admin@hassad.com` user; in production
   * it must be whichever admin the operator provisioned first.
   *
   * Cached after the first successful lookup so we don't issue a query
   * on every recompute. The cache is per-service-instance (singleton
   * lifecycle), which is fine because the admin user rarely changes
   * at runtime.
   */
  private cachedSystemUserId: string | null = null;

  private async resolveSystemUserId(): Promise<string> {
    if (this.cachedSystemUserId) {
      return this.cachedSystemUserId;
    }

    const admin = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        role: { name: "ADMIN" },
      },
      select: { id: true },
    });

    if (!admin) {
      // Throwing here is caught by the try/catch in `recomputeAll()`,
      // so the counter write above is preserved. We throw rather than
      // hardcode a fallback string because hardcoding `"system"` is
      // exactly the FK violation we're trying to fix.
      throw new Error(
        "No active admin user found; cannot write CLIENT_COUNTERS_UPDATED audit log",
      );
    }

    this.cachedSystemUserId = admin.id;
    return this.cachedSystemUserId;
  }

  /**
   * Pure aggregation: given a clientId and any `PrismaService`-shaped
   * client (which `PrismaClient` satisfies because `PrismaService extends
   * PrismaClient`), compute the counter delta.
   *
   * Returns `null` if the client no longer exists. The caller is then
   * expected to skip the write.
   *
   * Exposed (non-private) so the backfill script and any other Nest-less
   * caller can use the exact same formula as the runtime hooks.
   */
  async aggregateClientCounters(
    clientId: string,
    prisma: PrismaService,
  ): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    cancelledProjects: number;
    totalContractValue: number;
    totalInvoiced: number;
    totalPaid: number;
    lastProjectAt: Date | null;
    avgSatisfactionScore: number | null;
  } | null> {
    // Cheap existence check first — saves a roundtrip on a deleted client.
    const exists = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!exists) return null;

    const [
      projectStats,
      contractStats,
      invoiceStats,
      satisfactionStats,
      lastProject,
    ] = await Promise.all([
      prisma.project.groupBy({
        by: ["status"],
        where: { clientId, isArchived: false },
        _count: true,
      }),
      prisma.contract.aggregate({
        where: { clientId, status: { in: ["SIGNED", "ACTIVE"] } },
        _sum: { totalValue: true },
      }),
      prisma.invoice.aggregate({
        where: { clientId, status: { in: ["PAID", "PARTIAL"] } },
        _sum: { amount: true },
      }),
      prisma.satisfactionRating.aggregate({
        where: { clientId },
        _avg: { score: true },
      }),
      prisma.project.findFirst({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalProjects: projectStats.reduce((sum, g) => sum + g._count, 0),
      activeProjects:
        projectStats.find((g) => g.status === "ACTIVE")?._count ?? 0,
      completedProjects:
        projectStats.find((g) => g.status === "COMPLETED")?._count ?? 0,
      cancelledProjects:
        projectStats.find((g) => g.status === "CANCELLED")?._count ?? 0,
      totalContractValue: contractStats._sum.totalValue ?? 0,
      totalInvoiced: invoiceStats._sum.amount ?? 0,
      totalPaid: invoiceStats._sum.amount ?? 0,
      lastProjectAt: lastProject?.createdAt ?? null,
      avgSatisfactionScore: satisfactionStats._avg.score ?? null,
    };
  }

  /** Hook: a project's status changed — refresh its owning client's counters. */
  async onProjectStatusChange(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    if (project) {
      await this.recomputeAll(project.clientId);
    }
  }

  /** Hook: an invoice flipped to PAID or PARTIAL — refresh counters. */
  async onInvoicePaid(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { clientId: true },
    });
    if (invoice) {
      await this.recomputeAll(invoice.clientId);
    }
  }

  /** Hook: a satisfaction rating was submitted. */
  async onSatisfactionRated(clientId: string): Promise<void> {
    await this.recomputeAll(clientId);
  }

  /** Hook: a contract was signed or activated — refresh counters. */
  async onContractSigned(contractId: string): Promise<void> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { clientId: true },
    });
    if (contract) {
      await this.recomputeAll(contract.clientId);
    }
  }
}
