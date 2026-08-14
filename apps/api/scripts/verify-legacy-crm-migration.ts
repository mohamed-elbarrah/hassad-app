import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [legacyLeads, migrationRows, unresolvedContracts, leadOnlyProposals] =
    await Promise.all([
      prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        'SELECT COUNT(*)::bigint AS count FROM "legacy_leads"',
      ),
      prisma.legacyLeadMigration.findMany({
        select: { legacyLeadId: true, requestId: true, status: true },
      }),
      prisma.contract.count({ where: { requestId: null } }),
      prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        'SELECT COUNT(*)::bigint AS count FROM "legacy_lead_migrations" m JOIN "proposals" p ON p."legacy_lead_id" = m."lead_id" WHERE p."request_id" IS NULL',
      ),
    ]);

  const failed = migrationRows.filter((migration) => migration.status === "FAILED");
  const incomplete = migrationRows.filter(
    (migration) => !migration.requestId || migration.status === "PENDING",
  );
  const report = {
    archivedLeads: Number(legacyLeads[0]?.count ?? 0),
    migrationRows: migrationRows.length,
    failedMigrations: failed.length,
    incompleteMigrations: incomplete.length,
    leadOnlyProposals: Number(leadOnlyProposals[0]?.count ?? 0),
    unresolvedContracts,
  };
  console.log(JSON.stringify(report, null, 2));

  const strict = process.argv.includes("--strict");
  if (failed.length || incomplete.length || report.leadOnlyProposals || (strict && unresolvedContracts)) {
    throw new Error("Legacy CRM migration verification failed");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
