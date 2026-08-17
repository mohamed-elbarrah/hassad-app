import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const statusPreference: Record<string, string[]> = {
  ACTIVE: ["PROJECT_CREATED", "SIGNED", "CONTRACT_SENT", "CONTRACT_PREPARATION"],
  COMPLETED: ["PROJECT_CREATED", "SIGNED", "CONTRACT_SENT", "CONTRACT_PREPARATION"],
  SIGNED: ["SIGNED", "CONTRACT_PREPARATION", "CONTRACT_SENT"],
  SENT: ["CONTRACT_SENT", "CONTRACT_PREPARATION"],
  DRAFT: ["CONTRACT_PREPARATION", "NEGOTIATION", "PROPOSAL_SENT"],
  EXPIRED: ["CONTRACT_PREPARATION", "CONTRACT_SENT", "SIGNED"],
  CANCELLED: ["CANCELLED", "CONTRACT_PREPARATION", "SIGNED"],
};

async function main() {
  const reviews = await prisma.legacyContractMigrationReview.findMany({
    where: { resolvedAt: null },
  });
  const plan: Array<{ reviewId: string; contractId: string; requestId?: string; createRequest: boolean }> = [];

  for (const review of reviews) {
    const contract = await prisma.contract.findUnique({
      where: { id: review.contractId },
      select: {
        id: true,
        title: true,
        status: true,
        clientId: true,
        client: { select: { companyName: true } },
      },
    });
    if (!contract) continue;

    const candidateIds = Array.isArray(review.candidateRequestIds)
      ? review.candidateRequestIds.filter((id): id is string => typeof id === "string")
      : [];
    const candidates = await prisma.request.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, status: true, createdAt: true },
    });
    const preference = statusPreference[contract.status] ?? ["SIGNED", "CONTRACT_PREPARATION"];
    const request = [...candidates]
      .sort((a, b) => {
        const rankA = preference.indexOf(a.status);
        const rankB = preference.indexOf(b.status);
        return (rankA < 0 ? 999 : rankA) - (rankB < 0 ? 999 : rankB) || b.createdAt.getTime() - a.createdAt.getTime();
      })[0];

    plan.push({ reviewId: review.id, contractId: contract.id, requestId: request?.id, createRequest: !request });
    console.log(JSON.stringify({
      contract: contract.title,
      client: contract.client.companyName,
      contractStatus: contract.status,
      selectedRequest: request?.id ?? "CREATE_EXPLICIT_RECONCILIATION_REQUEST",
      selectedStatus: request?.status ?? (contract.status === "ACTIVE" || contract.status === "COMPLETED" ? "PROJECT_CREATED" : "SIGNED"),
    }));
  }

  if (!apply) {
    console.log(`Dry run only. Re-run with --apply to apply ${plan.length} deterministic resolutions.`);
    return;
  }

  for (const item of plan) {
    await prisma.$transaction(async (tx) => {
      let requestId = item.requestId;
      if (!requestId) {
        const contract = await tx.contract.findUniqueOrThrow({
          where: { id: item.contractId },
          select: { clientId: true, title: true, status: true, client: { select: { companyName: true, businessName: true, businessType: true, user: { select: { name: true, email: true, phoneWhatsapp: true } } } } },
        });
        const status = contract.status === "ACTIVE" || contract.status === "COMPLETED" ? "PROJECT_CREATED" : "SIGNED";
        const request = await tx.request.create({
          data: {
            clientId: contract.clientId,
            companyName: contract.client.companyName,
            contactName: contract.client.user?.name ?? contract.client.companyName,
            phoneWhatsapp: contract.client.user?.phoneWhatsapp ?? "",
            email: contract.client.user?.email ?? undefined,
            businessName: contract.client.businessName,
            businessType: contract.client.businessType,
            source: "DIRECT",
            status,
            crmStage: status === "PROJECT_CREATED" ? "ACTIVE" : "SIGNED",
            notes: `Explicit reconciliation request for legacy contract: ${contract.title}`,
          },
        });
        await tx.requestStatusHistory.create({ data: { requestId: request.id, toStatus: status, note: "Legacy contract reconciliation" } });
        requestId = request.id;
      }
      await tx.contract.update({ where: { id: item.contractId }, data: { requestId } });
      await tx.legacyContractMigrationReview.update({ where: { id: item.reviewId }, data: { resolvedRequestId: requestId, resolvedAt: new Date(), candidateRequestIds: requestId && !item.requestId ? [requestId] : undefined } });
    });
  }
  console.log(`Applied ${plan.length} contract resolutions.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
