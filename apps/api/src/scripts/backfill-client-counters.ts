/**
 * Manual counter-recovery script.
 *
 * **You should NOT need to run this under normal operation.**
 *
 * The standard deploy path is:
 *   1. `prisma migrate deploy` runs the new migration
 *      `20260627020000_backfill_client_counters`, which backfills every
 *      client's denormalized counters atomically as part of the deploy.
 *   2. The runtime hooks in `ClientCounterService` keep counters in sync
 *      on every relevant state transition (contract signed, invoice paid,
 *      project approved, etc.).
 *
 * This script exists for the rare cases where the normal path doesn't
 * apply:
 *   - Manual SQL data imports / fix-ups outside migrations.
 *   - Bulk backfills from a staging DB into production.
 *   - Drift diagnosis (e.g. "the KPI grid looks wrong, recompute everything").
 *
 * Idempotent: safe to run any number of times. The output of
 * `recomputeAll()` is deterministic given the current aggregate state, so
 * re-running always converges to the same answer.
 *
 * Single source of truth: this script delegates to
 * `ClientCounterService.recomputeAll()` so the formula stays in lockstep
 * with the runtime code. If you change the formula, update both the
 * service AND the migration `20260627020000_backfill_client_counters`.
 */

import { ClientCounterService } from "../modules/crm/services/client-counter.service";
import { PrismaService } from "../prisma/prisma.service";

async function main() {
  // We instantiate the service with a raw `PrismaService` instead of
  // bootstrapping a full Nest application — this script has no DI
  // dependencies beyond Prisma, and skipping Nest keeps the startup
  // under a second even on large databases. `PrismaService` extends
  // `PrismaClient` so all the queries work identically; the difference
  // is only in lifecycle hooks (which we don't need for a one-shot
  // backfill).
  const prisma = new PrismaService();
  const counterService = new ClientCounterService(prisma);

  try {
    const clients = await prisma.client.findMany({ select: { id: true } });
    console.log(`Recomputing counters for ${clients.length} clients...`);

    let updated = 0;
    for (const client of clients) {
      await counterService.recomputeAll(client.id);
      updated++;
    }

    console.log(`Done. ${updated} clients updated.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
