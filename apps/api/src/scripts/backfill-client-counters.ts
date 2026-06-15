import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    select: { id: true },
  });

  for (const client of clients) {
    const [projectStats, contractStats, invoiceStats, satisfactionStats, lastProject] =
      await Promise.all([
        prisma.project.groupBy({
          by: ["status"],
          where: { clientId: client.id, isArchived: false },
          _count: true,
        }),
        prisma.contract.aggregate({
          where: { clientId: client.id, status: { in: ["SIGNED", "ACTIVE"] } },
          _sum: { totalValue: true },
        }),
        prisma.invoice.aggregate({
          where: { clientId: client.id, status: "PAID" },
          _sum: { amount: true },
        }),
        prisma.satisfactionRating.aggregate({
          where: { clientId: client.id },
          _avg: { score: true },
        }),
        prisma.project.findFirst({
          where: { clientId: client.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);

    await prisma.client.update({
      where: { id: client.id },
      data: {
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
      },
    });

    console.log(`Updated counters for client ${client.id}`);
  }

  console.log("Done. All counters backfilled.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
