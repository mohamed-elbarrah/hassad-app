import { randomUUID } from "node:crypto";
import {
  CrmStage as PrismaCrmStage,
  PrismaClient,
  RequestStatus as PrismaRequestStatus,
} from "@prisma/client";

/**
 * Reconciles only facts that can be established without guessing:
 * - a SENT contract's preparation request must be CONTRACT_SENT;
 * - a SIGNED contract's sent request must be SIGNED;
 * - an ACTIVE/COMPLETED contract with a project must have a PROJECT_CREATED request;
 * - a reviewed legacy contract may be linked to one of its same-client candidates.
 *
 * Dry-run is the default. --apply re-reads every item in a transaction before
 * changing it and appends a machine-readable status-history audit entry.
 */
const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const strict = process.argv.includes("--strict");
const runId = randomUUID();

type Action =
  | {
      kind: "UPDATE_REQUEST_STATUS";
      contractId: string;
      requestId: string;
      contractStatus: string;
      from: PrismaRequestStatus;
      to: PrismaRequestStatus;
      code: string;
    }
  | {
      kind: "LINK_REVIEWED_REQUEST";
      reviewId: string;
      contractId: string;
      requestId: string;
      code: string;
    };

type Finding = {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR";
  contractId: string;
  requestId?: string;
  reviewId?: string;
  observed: Record<string, unknown>;
  action?: Action;
};

function finding(
  code: Finding["code"],
  severity: Finding["severity"],
  contractId: string,
  observed: Finding["observed"],
  extra: Pick<Finding, "requestId" | "reviewId" | "action"> = {},
): Finding {
  return { code, severity, contractId, observed, ...extra };
}

async function main() {
  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
      status: true,
      requestId: true,
      clientId: true,
      proposalId: true,
      initialPaymentRequired: true,
      initialPaymentStatus: true,
      request: {
        select: { id: true, clientId: true, status: true, crmStage: true },
      },
      proposal: { select: { requestId: true } },
      projects: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true },
        take: 1,
      },
    },
  });
  const reviews = await prisma.legacyContractMigrationReview.findMany({
    where: { resolvedAt: null },
    select: { id: true, contractId: true, candidateRequestIds: true },
  });
  const findings: Finding[] = [];
  const actions: Action[] = [];

  for (const contract of contracts) {
    const request = contract.request;
    if (request && request.clientId !== contract.clientId) {
      findings.push(
        finding(
          "CONTRACT_REQUEST_CLIENT_MISMATCH",
          "ERROR",
          contract.id,
          {
            contractClientId: contract.clientId,
            requestClientId: request.clientId,
          },
          { requestId: request.id },
        ),
      );
    }
    if (
      contract.proposalId != null &&
      (!contract.proposal || contract.proposal.requestId !== contract.requestId)
    ) {
      findings.push(
        finding(
          "CONTRACT_PROPOSAL_REQUEST_MISMATCH",
          "ERROR",
          contract.id,
          {
            contractRequestId: contract.requestId,
            proposalRequestId: contract.proposal?.requestId ?? null,
          },
          { requestId: contract.requestId ?? undefined },
        ),
      );
    }
    if (!request) {
      if (contract.requestId)
        findings.push(
          finding("CONTRACT_REQUEST_REFERENCE_MISSING", "ERROR", contract.id, {
            requestId: contract.requestId,
          }),
        );
      continue;
    }

    const hasIntegrityMismatch =
      request.clientId !== contract.clientId ||
      (contract.proposalId != null &&
        (!contract.proposal ||
          contract.proposal.requestId !== contract.requestId));
    let action: Action | undefined;
    if (
      !hasIntegrityMismatch &&
      contract.status === "SENT" &&
      request.status === "CONTRACT_PREPARATION"
    ) {
      action = {
        kind: "UPDATE_REQUEST_STATUS",
        contractId: contract.id,
        requestId: request.id,
        contractStatus: contract.status,
        from: PrismaRequestStatus.CONTRACT_PREPARATION,
        to: PrismaRequestStatus.CONTRACT_SENT,
        code: "CONTRACT_SENT_REQUEST_STATUS_RECONCILED",
      };
    } else if (
      !hasIntegrityMismatch &&
      contract.status === "SIGNED" &&
      request.status === "CONTRACT_SENT"
    ) {
      action = {
        kind: "UPDATE_REQUEST_STATUS",
        contractId: contract.id,
        requestId: request.id,
        contractStatus: contract.status,
        from: PrismaRequestStatus.CONTRACT_SENT,
        to: PrismaRequestStatus.SIGNED,
        code: "SIGNED_REQUEST_STATUS_RECONCILED",
      };
    } else if (
      !hasIntegrityMismatch &&
      ["ACTIVE", "COMPLETED"].includes(contract.status) &&
      contract.projects.length > 0 &&
      contract.projects[0].status !== "CANCELLED" &&
      (!contract.initialPaymentRequired ||
        contract.initialPaymentStatus === "PAID") &&
      request.status === "SIGNED"
    ) {
      action = {
        kind: "UPDATE_REQUEST_STATUS",
        contractId: contract.id,
        requestId: request.id,
        contractStatus: contract.status,
        from: PrismaRequestStatus.SIGNED,
        to: PrismaRequestStatus.PROJECT_CREATED,
        code: "PROJECT_CREATED_REQUEST_STATUS_RECONCILED",
      };
    }
    if (action) {
      actions.push(action);
      findings.push(
        finding(
          action.code,
          "WARNING",
          contract.id,
          {
            contractStatus: contract.status,
            requestStatus: request.status,
            requestCrmStage: request.crmStage,
          },
          { requestId: request.id, action },
        ),
      );
    }
  }

  for (const review of reviews) {
    const contract = contracts.find((item) => item.id === review.contractId);
    if (!contract) {
      findings.push(
        finding(
          "REVIEW_CONTRACT_NOT_FOUND",
          "ERROR",
          review.contractId,
          {},
          { reviewId: review.id },
        ),
      );
      continue;
    }
    const hasIntegrityMismatch =
      contract.proposalId != null &&
      (!contract.proposal ||
        contract.proposal.requestId !== contract.requestId);
    const ids = Array.isArray(review.candidateRequestIds)
      ? review.candidateRequestIds.filter(
          (id): id is string => typeof id === "string",
        )
      : [];
    const candidates = await prisma.request.findMany({
      where: { id: { in: ids }, clientId: contract.clientId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        contracts: { select: { id: true }, take: 1 },
      },
    });
    const preference =
      contract.status === "SENT"
        ? ["CONTRACT_SENT", "CONTRACT_PREPARATION"]
        : ["SIGNED", "CONTRACT_SENT", "CONTRACT_PREPARATION"];
    const selected = candidates
      .filter(
        (candidate) =>
          candidate.contracts.length === 0 &&
          preference.includes(candidate.status),
      )
      .sort(
        (a, b) =>
          preference.indexOf(a.status) - preference.indexOf(b.status) ||
          b.createdAt.getTime() - a.createdAt.getTime() ||
          a.id.localeCompare(b.id),
      )[0];
    if (selected && !contract.requestId && !hasIntegrityMismatch) {
      const action: Action = {
        kind: "LINK_REVIEWED_REQUEST",
        reviewId: review.id,
        contractId: contract.id,
        requestId: selected.id,
        code: "REVIEWED_CONTRACT_REQUEST_LINK_RECONCILED",
      };
      actions.push(action);
      findings.push(
        finding(
          action.code,
          "WARNING",
          contract.id,
          {
            candidateCount: candidates.length,
            selectedRequestStatus: selected.status,
          },
          { reviewId: review.id, requestId: selected.id, action },
        ),
      );
    } else if (selected && contract.requestId) {
      findings.push(
        finding(
          "REVIEW_CONTRACT_ALREADY_LINKED",
          "ERROR",
          contract.id,
          {
            existingRequestId: contract.requestId,
            selectedRequestId: selected.id,
          },
          { reviewId: review.id, requestId: contract.requestId },
        ),
      );
    } else if (!selected) {
      findings.push(
        finding(
          "REVIEW_REQUIRES_MANUAL_REQUEST_SELECTION",
          "ERROR",
          contract.id,
          { candidateCount: candidates.length },
          { reviewId: review.id },
        ),
      );
    }
  }

  let appliedActionCount = 0;
  const applyResults: Array<{
    code: string;
    contractId: string;
    requestId: string;
    outcome: "APPLIED" | "SKIPPED_STALE";
    reason?: "DRY_RUN_ASSUMPTIONS_CHANGED";
  }> = [];
  if (apply) {
    for (const action of actions) {
      let applied: boolean;
      try {
        applied = await prisma.$transaction(
          async (tx) => {
            if (action.kind === "UPDATE_REQUEST_STATUS") {
              // Lock both records before re-reading any dry-run predicate.
              await tx.$queryRaw<Array<{ id: string }>>`
              SELECT id FROM requests WHERE id = ${action.requestId} FOR UPDATE
            `;
              await tx.$queryRaw<Array<{ id: string }>>`
              SELECT id FROM contracts WHERE id = ${action.contractId} FOR UPDATE
            `;
              // Re-check every predicate used by the dry run, including relation
              // integrity and the project/payment gates.
              const [current, contract] = await Promise.all([
                tx.request.findUnique({
                  where: { id: action.requestId },
                  select: { status: true, clientId: true },
                }),
                tx.contract.findUnique({
                  where: { id: action.contractId },
                  select: {
                    requestId: true,
                    status: true,
                    clientId: true,
                    proposalId: true,
                    proposal: { select: { requestId: true } },
                    initialPaymentRequired: true,
                    initialPaymentStatus: true,
                    projects: {
                      where: { status: { not: "CANCELLED" } },
                      orderBy: { createdAt: "asc" },
                      select: { id: true, status: true },
                      take: 1,
                    },
                  },
                }),
              ]);
              const hasIntegrityMismatch =
                !contract ||
                contract.clientId !== current?.clientId ||
                (contract.proposalId != null &&
                  (!contract.proposal ||
                    contract.proposal.requestId !== contract.requestId));
              const projectGateSatisfied =
                action.to !== PrismaRequestStatus.PROJECT_CREATED ||
                ((contract?.status === "ACTIVE" ||
                  contract?.status === "COMPLETED") &&
                  contract.projects.length > 0 &&
                  contract.projects[0].status !== "CANCELLED" &&
                  (!contract.initialPaymentRequired ||
                    contract.initialPaymentStatus === "PAID"));
              // This allowlist is intentional: reconciliation may only advance the
              // CRM request workflow. It must never mutate financial or legal state.
              const safeTransition =
                (action.from === PrismaRequestStatus.CONTRACT_PREPARATION &&
                  action.to === PrismaRequestStatus.CONTRACT_SENT &&
                  action.contractStatus === "SENT") ||
                (action.from === PrismaRequestStatus.CONTRACT_SENT &&
                  action.to === PrismaRequestStatus.SIGNED &&
                  action.contractStatus === "SIGNED") ||
                (action.from === PrismaRequestStatus.SIGNED &&
                  action.to === PrismaRequestStatus.PROJECT_CREATED &&
                  (action.contractStatus === "ACTIVE" ||
                    action.contractStatus === "COMPLETED"));
              if (
                !current ||
                !contract ||
                !safeTransition ||
                hasIntegrityMismatch ||
                !projectGateSatisfied ||
                contract.status !== action.contractStatus ||
                contract.requestId !== action.requestId ||
                current.status !== action.from
              )
                return false;
              const crmStage =
                action.to === PrismaRequestStatus.PROJECT_CREATED
                  ? PrismaCrmStage.ACTIVE
                  : action.to === PrismaRequestStatus.SIGNED
                    ? PrismaCrmStage.SIGNED
                    : PrismaCrmStage.CONTRACT_SENT;
              const updated = await tx.request.updateMany({
                // The guarded write makes a concurrent transition stale rather
                // than silently overwriting it.
                where: {
                  id: action.requestId,
                  clientId: contract.clientId,
                  status: action.from,
                },
                data: { status: action.to, crmStage },
              });
              if (updated.count !== 1) return false;
              await tx.requestStatusHistory.create({
                data: {
                  requestId: action.requestId,
                  fromStatus: action.from,
                  toStatus: action.to,
                  note: `RECONCILIATION_CODE=${action.code};RUN_ID=${runId}`,
                },
              });
              await tx.ledger.create({
                data: {
                  action: `crm.contract-migration.${action.code}`,
                  entity: "request",
                  entityId: action.requestId,
                  after: {
                    contractId: action.contractId,
                    fromStatus: action.from,
                    toStatus: action.to,
                    runId,
                  },
                  metadata: { reconciliationCode: action.code, runId },
                },
              });
              return true;
            }

            // Lock before any snapshot-dependent reads. Contract.requestId is not
            // unique, so the candidate row is the serialization point for reuse.
            await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM requests WHERE id = ${action.requestId} FOR UPDATE
          `;
            const [review, contract] = await Promise.all([
              tx.legacyContractMigrationReview.findUnique({
                where: { id: action.reviewId },
                select: {
                  resolvedAt: true,
                  candidateRequestIds: true,
                  contractId: true,
                },
              }),
              tx.contract.findUnique({
                where: { id: action.contractId },
                select: {
                  requestId: true,
                  clientId: true,
                  status: true,
                  proposalId: true,
                  proposal: { select: { requestId: true } },
                },
              }),
            ]);
            const candidateIds = Array.isArray(review?.candidateRequestIds)
              ? review.candidateRequestIds.filter(
                  (id): id is string => typeof id === "string",
                )
              : [];
            const candidates = await tx.request.findMany({
              where: {
                id: { in: candidateIds },
                clientId: contract?.clientId ?? "__missing_contract__",
              },
              select: {
                id: true,
                status: true,
                createdAt: true,
                contracts: { select: { id: true }, take: 1 },
              },
            });
            const preference =
              contract?.status === "SENT"
                ? ["CONTRACT_SENT", "CONTRACT_PREPARATION"]
                : ["SIGNED", "CONTRACT_SENT", "CONTRACT_PREPARATION"];
            const selected = candidates
              .filter(
                (candidate) =>
                  candidate.contracts.length === 0 &&
                  preference.includes(candidate.status),
              )
              .sort(
                (a, b) =>
                  preference.indexOf(a.status) - preference.indexOf(b.status) ||
                  b.createdAt.getTime() - a.createdAt.getTime() ||
                  a.id.localeCompare(b.id),
              )[0];
            // Revalidate review ownership, resolution state, candidate ranking,
            // and contract linkage before linking anything.
            const hasIntegrityMismatch =
              contract?.proposalId != null &&
              (!contract.proposal ||
                contract.proposal.requestId !== contract.requestId);
            if (
              !review ||
              review.contractId !== action.contractId ||
              review.resolvedAt ||
              hasIntegrityMismatch ||
              contract?.requestId != null ||
              !contract ||
              !selected ||
              selected.id !== action.requestId
            )
              return false;
            const linked = await tx.contract.updateMany({
              where: {
                id: action.contractId,
                clientId: contract.clientId,
                requestId: null,
              },
              data: { requestId: action.requestId },
            });
            if (linked.count !== 1) return false;
            const resolved = await tx.legacyContractMigrationReview.updateMany({
              where: {
                id: action.reviewId,
                contractId: action.contractId,
                resolvedAt: null,
              },
              data: {
                resolvedRequestId: action.requestId,
                resolvedAt: new Date(),
              },
            });
            if (resolved.count !== 1) {
              // Never commit the contract link without its matching review
              // resolution. Throwing rolls back both writes atomically.
              throw new Error("RECONCILIATION_LINK_AUDIT_UPDATE_FAILED");
            }
            await tx.ledger.create({
              data: {
                action: `crm.contract-migration.${action.code}`,
                entity: "contract",
                entityId: action.contractId,
                after: {
                  requestId: action.requestId,
                  migrationReviewId: action.reviewId,
                  runId,
                },
                metadata: { reconciliationCode: action.code, runId },
              },
            });
            return true;
          },
          { isolationLevel: "Serializable" },
        );
      } catch (error) {
        // Serializable conflicts mean the snapshot is stale; keep the action
        // auditable and let --strict fail the run without hiding the cause.
        if ((error as { code?: unknown })?.code === "P2034") {
          applied = false;
        } else {
          throw error;
        }
      }
      const result = {
        code: action.code,
        contractId: action.contractId,
        requestId: action.requestId,
        outcome: applied ? ("APPLIED" as const) : ("SKIPPED_STALE" as const),
        ...(applied ? {} : { reason: "DRY_RUN_ASSUMPTIONS_CHANGED" as const }),
      };
      applyResults.push(result);
      if (applied) {
        appliedActionCount += 1;
      } else {
        // Keep stale actions in the machine-readable report; strict mode treats
        // them as failures instead of claiming a successful reconciliation.
        findings.push(
          finding(
            "RECONCILIATION_ACTION_STALE",
            "ERROR",
            action.contractId,
            { action, reason: result.reason },
            {
              requestId: action.requestId,
              reviewId:
                action.kind === "LINK_REVIEWED_REQUEST"
                  ? action.reviewId
                  : undefined,
              action,
            },
          ),
        );
      }
    }
  }

  const hasUnresolvedErrors = findings.some(
    (item) => item.severity === "ERROR",
  );
  const hasStaleActions = applyResults.some(
    (item) => item.outcome === "SKIPPED_STALE",
  );
  // Applying a reconciliation is never a successful operation when the
  // resulting state still needs review. --strict additionally makes a dry run
  // fail, while the default dry run remains safe to use for inspection.
  const shouldFail =
    (apply || strict) && (hasUnresolvedErrors || hasStaleActions);
  const report = {
    success: !shouldFail,
    data: {
      runId,
      mode: apply ? "APPLY" : "DRY_RUN",
      strict,
      findings,
      actionCount: actions.length,
      appliedActionCount,
      applyResults,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      deterministicOnly: true,
      result:
        hasUnresolvedErrors || hasStaleActions
          ? "REVIEW_REQUIRED"
          : "CLEAN_OR_APPLICABLE",
      exitCode: shouldFail ? 2 : 0,
    },
  };
  console.log(JSON.stringify(report, null, 2));
  if (shouldFail) process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify({
        success: false,
        error: {
          code: "RECONCILIATION_FAILED",
          details: { name: error instanceof Error ? error.name : "UNKNOWN" },
        },
      }),
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
