import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [unlinkedLeads, migrations, unresolvedContracts, leadOnlyProposals] =
    await Promise.all([
      prisma.lead.count({ where: { requestId: null } }),
      prisma.legacyLeadMigration.findMany({
        select: { leadId: true, requestId: true, status: true },
      }),
      prisma.contract.count({ where: { requestId: null } }),
      prisma.proposal.count({ where: { requestId: null, leadId: { not: null } } }),
    ]);

  const failed = migrations.filter((migration) => migration.status === "FAILED");
  const incomplete = migrations.filter(
    (migration) => !migration.requestId || migration.status === "PENDING",
  );

  const report = {
    unlinkedLeads,
    migrationRows: migrations.length,
    failedMigrations: failed.length,
    incompleteMigrations: incomplete.length,
    leadOnlyProposals,
    unresolvedContracts,
  };

  console.log(JSON.stringify(report, null, 2));

  if (unlinkedLeads || failed.length || incomplete.length || leadOnlyProposals) {
    throw new Error("Legacy CRM migration verification failed");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
