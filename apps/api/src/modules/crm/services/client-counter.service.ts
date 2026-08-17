import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ApiException } from "../../../common/errors/api-error";
import { internal } from "../../../common/errors/domain-errors";

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

/**
 * Owns the denormalized counter fields on the `Client` row.
 *
 * Why denormalized counters:
 *   The portal profile page (`/portal/profile`) renders a KPI grid that
 *   shows "total projects", "contract value", etc. Counting these on every
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
   * Safe to call concurrently for the same client — aggregation acquires the
   * owning client row lock before reading source tables, so concurrent source
   * mutations and recomputes are ordered by the same database lock.
   */
  async recomputeAll(
    clientId: string,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    try {
      const writeCountersAndHistory = async (tx: PrismaExecutor) => {
        const update = await this.aggregateClientCounters(clientId, tx);
        if (!update) {
          return false;
        }

        const systemUserId = await this.resolveSystemUserId(tx);
        await tx.client.update({
          where: { id: clientId },
          data: update,
        });
        await tx.clientHistoryLog.create({
          data: {
            clientId,
            userId: systemUserId,
            eventType: "CLIENT_COUNTERS_UPDATED",
            description: "Client counters recomputed",
          },
        });
        return true;
      };

      const recomputed = transaction
        ? await writeCountersAndHistory(transaction)
        : await this.prisma.$transaction((tx) => writeCountersAndHistory(tx));
      if (!recomputed) return;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw internal(
        "CLIENT_COUNTER_UPDATE_FAILED",
        "Unable to update client counters",
        { clientId },
      );
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

  private async resolveSystemUserId(
    prisma: PrismaExecutor = this.prisma,
  ): Promise<string> {
    if (this.cachedSystemUserId) {
      return this.cachedSystemUserId;
    }

    const admin = await prisma.user.findFirst({
      where: {
        isActive: true,
        role: { name: "ADMIN" },
      },
      select: { id: true },
    });

    if (!admin) {
      // Surface a stable error rather than hardcoding a fallback string that
      // would create an invalid history-log foreign key.
      throw internal(
        "CLIENT_COUNTER_SYSTEM_USER_NOT_FOUND",
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
    prisma: PrismaExecutor,
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
    await prisma.$queryRaw`
      SELECT id
      FROM "clients"
      WHERE id = ${clientId}
      FOR UPDATE
    `;

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
      paymentStats,
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
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          OR: [{ clientId }, { clientId: null, invoice: { is: { clientId } } }],
        },
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
      totalPaid: paymentStats._sum.amount ?? 0,
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
