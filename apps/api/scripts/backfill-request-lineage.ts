import { Prisma, PrismaClient } from "@prisma/client";
import {
  ClientStatus,
  ContractStatus,
  PipelineStage,
  ProposalStatus,
  RequestStatus,
  UserRole,
} from "@hassad/shared";

const prisma = new PrismaClient();

function getRequestStatusFromLeadStage(
  stage: PipelineStage | string,
): RequestStatus {
  switch (stage) {
    case PipelineStage.PROPOSAL_SENT:
      return RequestStatus.PROPOSAL_SENT;
    case PipelineStage.FOLLOW_UP:
      return RequestStatus.NEGOTIATION;
    case PipelineStage.APPROVED:
      return RequestStatus.CONTRACT_PREPARATION;
    case PipelineStage.CONTRACT_SIGNED:
      return RequestStatus.SIGNED;
    case PipelineStage.MEETING_SCHEDULED:
    case PipelineStage.MEETING_DONE:
      return RequestStatus.PROPOSAL_IN_PROGRESS;
    default:
      return RequestStatus.QUALIFYING;
  }
}

function deriveRequestStatus(
  baseStatus: RequestStatus,
  proposalStatuses: ProposalStatus[],
  contractStatuses: ContractStatus[],
  hasProject: boolean,
): RequestStatus {
  if (hasProject) {
    return RequestStatus.PROJECT_CREATED;
  }

  if (
    contractStatuses.some((status) =>
      [
        ContractStatus.SIGNED,
        ContractStatus.ACTIVE,
        ContractStatus.EXPIRED,
      ].includes(status),
    )
  ) {
    return RequestStatus.SIGNED;
  }

  if (contractStatuses.includes(ContractStatus.SENT)) {
    return RequestStatus.CONTRACT_SENT;
  }

  if (proposalStatuses.includes(ProposalStatus.APPROVED)) {
    return RequestStatus.CONTRACT_PREPARATION;
  }

  if (proposalStatuses.includes(ProposalStatus.SENT)) {
    return RequestStatus.PROPOSAL_SENT;
  }

  if (proposalStatuses.includes(ProposalStatus.REVISION_REQUESTED)) {
    return RequestStatus.PROPOSAL_IN_PROGRESS;
  }

  return baseStatus;
}

async function resolveFallbackSalesId(tx: Prisma.TransactionClient) {
  const salesUser = await tx.user.findFirst({
    where: { isActive: true, role: { name: UserRole.SALES } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (salesUser) {
    return salesUser.id;
  }

  const adminUser = await tx.user.findFirst({
    where: { isActive: true, role: { name: UserRole.ADMIN } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return adminUser?.id ?? null;
}

async function resolveClientUserId(
  tx: Prisma.TransactionClient,
  userId?: string | null,
) {
  if (!userId) {
    return null;
  }

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, role: { select: { name: true } } },
  });

  return user?.role.name === UserRole.CLIENT ? user.id : null;
}

async function ensureClientForLead(
  tx: Prisma.TransactionClient,
  lead: {
    id: string;
    companyName: string;
    contactName: string;
    phoneWhatsapp: string;
    email: string | null;
    businessName: string;
    businessType: any;
    assignedTo: string | null;
    createdBy: string | null;
  },
  fallbackSalesId: string | null,
) {
  const clientUserId = await resolveClientUserId(tx, lead.createdBy);

  let client = clientUserId
    ? await tx.client.findUnique({
        where: { userId: clientUserId },
        select: {
          id: true,
          leadId: true,
          userId: true,
          companyName: true,
          contactName: true,
          phoneWhatsapp: true,
          email: true,
          businessName: true,
          businessType: true,
          accountManager: true,
          status: true,
        },
      })
    : null;

  if (!client) {
    client = await tx.client.findFirst({
      where: { leadId: lead.id },
      select: {
        id: true,
        leadId: true,
        userId: true,
        companyName: true,
        contactName: true,
        phoneWhatsapp: true,
        email: true,
        businessName: true,
        businessType: true,
        accountManager: true,
        status: true,
      },
    });
  }

  if (!client && lead.email) {
    client = await tx.client.findFirst({
      where: { email: lead.email },
      select: {
        id: true,
        leadId: true,
        userId: true,
        companyName: true,
        contactName: true,
        phoneWhatsapp: true,
        email: true,
        businessName: true,
        businessType: true,
        accountManager: true,
        status: true,
      },
    });
  }

  if (client) {
    const data: Prisma.ClientUpdateInput = {};

    if (!client.userId && clientUserId) {
      data.user = { connect: { id: clientUserId } };
    }

    if (!client.leadId) {
      data.lead = { connect: { id: lead.id } };
    }

    if (!client.accountManager && (lead.assignedTo ?? fallbackSalesId)) {
      data.manager = {
        connect: { id: lead.assignedTo ?? fallbackSalesId ?? undefined },
      };
    }

    if (client.status !== ClientStatus.ACTIVE) {
      data.status = client.status ?? ClientStatus.LEAD;
    }

    if (Object.keys(data).length > 0) {
      client = await tx.client.update({
        where: { id: client.id },
        data,
        select: {
          id: true,
          leadId: true,
          userId: true,
          companyName: true,
          contactName: true,
          phoneWhatsapp: true,
          email: true,
          businessName: true,
          businessType: true,
          accountManager: true,
          status: true,
        },
      });
    }

    return { client, clientUserId, created: false };
  }

  const createdClient = await tx.client.create({
    data: {
      leadId: lead.id,
      userId: clientUserId ?? undefined,
      companyName: lead.companyName,
      contactName: lead.contactName,
      phoneWhatsapp: lead.phoneWhatsapp,
      email: lead.email ?? undefined,
      businessName: lead.businessName,
      businessType: lead.businessType,
      accountManager: lead.assignedTo ?? fallbackSalesId ?? undefined,
      status: ClientStatus.LEAD,
    },
    select: {
      id: true,
      leadId: true,
      userId: true,
      companyName: true,
      contactName: true,
      phoneWhatsapp: true,
      email: true,
      businessName: true,
      businessType: true,
      accountManager: true,
      status: true,
    },
  });

  return { client: createdClient, clientUserId, created: true };
}

type BackfillSummary = {
  createdClients: number;
  createdRequests: number;
  linkedLeads: number;
  linkedProposalRows: number;
  linkedContractRows: number;
  linkedProjectRows: number;
  syncedRequestServices: number;
  updatedRequestStatuses: number;
};

async function reconcileRequestStatus(
  tx: Prisma.TransactionClient,
  requestId: string,
  baseStatus: RequestStatus,
  changedBy: string | null,
  historyNote: string,
  summary: BackfillSummary,
) {
  const requestState = await tx.request.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });

  if (!requestState) {
    return;
  }

  const [linkedProposals, linkedContracts, linkedProject, historyCount] =
    await Promise.all([
      tx.proposal.findMany({
        where: { requestId },
        select: { status: true },
      }),
      tx.contract.findMany({
        where: { requestId },
        select: { status: true },
      }),
      tx.project.findFirst({
        where: { requestId },
        select: { id: true },
      }),
      tx.requestStatusHistory.count({
        where: { requestId },
      }),
    ]);

  const finalStatus = deriveRequestStatus(
    baseStatus,
    linkedProposals.map((proposal) => proposal.status as ProposalStatus),
    linkedContracts.map((contract) => contract.status as ContractStatus),
    Boolean(linkedProject),
  );

  if (requestState.status !== finalStatus) {
    await tx.request.update({
      where: { id: requestId },
      data: { status: finalStatus },
    });
    summary.updatedRequestStatuses += 1;
  }

  if (historyCount === 0) {
    await tx.requestStatusHistory.create({
      data: {
        requestId,
        toStatus: finalStatus,
        changedBy: changedBy ?? undefined,
        note: historyNote,
      },
    });
  }
}

async function main() {
  try {
    console.log(
      "Starting backfill: request lineage for legacy leads/proposals/contracts/projects",
    );

    const leads = await prisma.lead.findMany({
      include: {
        services: true,
        request: {
          select: { id: true, status: true, clientId: true, submittedBy: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (leads.length === 0) {
      console.log("No leads found. Nothing to backfill.");
      process.exit(0);
    }

    const summary = {
      createdClients: 0,
      createdRequests: 0,
      linkedLeads: 0,
      linkedProposalRows: 0,
      linkedContractRows: 0,
      linkedProjectRows: 0,
      syncedRequestServices: 0,
      updatedRequestStatuses: 0,
    };

    const errors: Array<{ leadId: string; error: unknown }> = [];

    for (const lead of leads) {
      console.log(`Processing lead ${lead.id} (${lead.companyName})`);

      try {
        await prisma.$transaction(async (tx) => {
          const fallbackSalesId = await resolveFallbackSalesId(tx);
          const { client, clientUserId, created } = await ensureClientForLead(
            tx,
            lead,
            fallbackSalesId,
          );

          if (created) {
            summary.createdClients += 1;
          }

          const baseStatus = getRequestStatusFromLeadStage(lead.pipelineStage);
          const assignedSalesId =
            lead.assignedTo ?? client.accountManager ?? fallbackSalesId ?? null;
          const primaryRequestData = {
            clientId: client.id,
            submittedBy: clientUserId ?? undefined,
            assignedSalesId: assignedSalesId ?? undefined,
            companyName: lead.companyName,
            contactName: lead.contactName,
            phoneWhatsapp: lead.phoneWhatsapp,
            email: lead.email ?? undefined,
            businessName: lead.businessName,
            businessType: lead.businessType,
            source: lead.source,
            notes: lead.notes ?? undefined,
          };

          let request = lead.request;

          if (!request) {
            request = await tx.request.create({
              data: {
                ...primaryRequestData,
                status: baseStatus,
              },
              select: {
                id: true,
                status: true,
                clientId: true,
                submittedBy: true,
              },
            });
            summary.createdRequests += 1;
          } else if (
            request.clientId !== client.id ||
            (!request.submittedBy && clientUserId)
          ) {
            request = await tx.request.update({
              where: { id: request.id },
              data: {
                clientId: client.id,
                submittedBy: request.submittedBy ?? clientUserId ?? undefined,
                assignedSalesId: assignedSalesId ?? undefined,
              },
              select: {
                id: true,
                status: true,
                clientId: true,
                submittedBy: true,
              },
            });
          }

          if (lead.requestId !== request.id) {
            await tx.lead.update({
              where: { id: lead.id },
              data: { requestId: request.id },
            });
            summary.linkedLeads += 1;
          }

          const existingRequestServices = await tx.requestService.findMany({
            where: { requestId: request.id },
            select: { serviceId: true },
          });
          const existingServiceIds = new Set(
            existingRequestServices.map((service) => service.serviceId),
          );
          const missingServices = lead.services.filter(
            (service) => !existingServiceIds.has(service.serviceId),
          );

          if (missingServices.length > 0) {
            await tx.requestService.createMany({
              data: missingServices.map((service) => ({
                requestId: request.id,
                serviceId: service.serviceId,
                quantity: service.quantity,
                notes: service.notes ?? undefined,
              })),
            });
            summary.syncedRequestServices += missingServices.length;
          }

          const proposals = await tx.proposal.findMany({
            where: { leadId: lead.id },
            select: { id: true, requestId: true, clientId: true, status: true },
          });

          for (const proposal of proposals) {
            if (proposal.requestId && proposal.clientId) {
              continue;
            }

            await tx.proposal.update({
              where: { id: proposal.id },
              data: {
                requestId: proposal.requestId ?? request.id,
                clientId: proposal.clientId ?? client.id,
              },
            });
            summary.linkedProposalRows += 1;
          }

          const relatedContracts = await tx.contract.findMany({
            where: {
              OR: [
                { requestId: request.id },
                { requestId: null, proposal: { leadId: lead.id } },
                ...(client.leadId === lead.id
                  ? [{ requestId: null, proposalId: null, clientId: client.id }]
                  : []),
              ],
            },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              requestId: true,
              proposalId: true,
              status: true,
              title: true,
            },
          });

          const requestBackfillNotes = new Map<string, string>([
            [request.id, "Backfilled from legacy lead workflow"],
          ]);

          const createSplitRequest = async (historyNote: string) => {
            const splitRequest = await tx.request.create({
              data: {
                ...primaryRequestData,
                notes: undefined,
                status: baseStatus,
              },
              select: {
                id: true,
                status: true,
                clientId: true,
                submittedBy: true,
              },
            });

            summary.createdRequests += 1;
            requestBackfillNotes.set(splitRequest.id, historyNote);

            return splitRequest;
          };

          const existingRequestProject = await tx.project.findFirst({
            where: { requestId: request.id },
            select: { id: true, contractId: true },
          });

          const primaryContractId =
            existingRequestProject?.contractId ??
            relatedContracts.find(
              (contract) => contract.requestId === request.id,
            )?.id ??
            relatedContracts[0]?.id ??
            null;

          const requestIdByContractId = new Map<string, string>();

          if (primaryContractId) {
            requestIdByContractId.set(primaryContractId, request.id);
          }

          for (const contract of relatedContracts) {
            const shouldStayOnPrimary = contract.id === primaryContractId;

            if (shouldStayOnPrimary) {
              requestIdByContractId.set(contract.id, request.id);

              if (!contract.requestId) {
                await tx.contract.update({
                  where: { id: contract.id },
                  data: { requestId: request.id },
                });
                summary.linkedContractRows += 1;
              }

              continue;
            }

            let targetRequestId = contract.requestId;

            if (!targetRequestId || targetRequestId === request.id) {
              const splitRequest = await createSplitRequest(
                `Backfilled from legacy contract branch: ${contract.title}`,
              );
              targetRequestId = splitRequest.id;
            }

            requestIdByContractId.set(contract.id, targetRequestId);

            if (contract.requestId !== targetRequestId) {
              await tx.contract.update({
                where: { id: contract.id },
                data: { requestId: targetRequestId },
              });
              summary.linkedContractRows += 1;
            }

            if (contract.proposalId) {
              const proposal = await tx.proposal.findUnique({
                where: { id: contract.proposalId },
                select: { id: true, requestId: true, clientId: true },
              });

              if (
                proposal &&
                (proposal.requestId !== targetRequestId ||
                  proposal.clientId !== client.id)
              ) {
                await tx.proposal.update({
                  where: { id: proposal.id },
                  data: {
                    requestId: targetRequestId,
                    clientId: proposal.clientId ?? client.id,
                  },
                });
                summary.linkedProposalRows += 1;
              }
            }
          }

          const projectCandidates = await tx.project.findMany({
            where: {
              OR: [
                { requestId: request.id },
                ...(relatedContracts.length > 0
                  ? [
                      {
                        contractId: {
                          in: relatedContracts.map((contract) => contract.id),
                        },
                      },
                    ]
                  : []),
                ...(client.leadId === lead.id
                  ? [{ contractId: null, clientId: client.id }]
                  : []),
              ],
            },
            orderBy: { createdAt: "asc" },
            select: { id: true, requestId: true, contractId: true, name: true },
          });

          let primaryRequestHasProject = projectCandidates.some(
            (project) => project.requestId === request.id,
          );

          for (const project of projectCandidates) {
            let targetRequestId = project.contractId
              ? (requestIdByContractId.get(project.contractId) ?? null)
              : project.requestId;

            if (!targetRequestId && !project.contractId) {
              if (!primaryRequestHasProject) {
                targetRequestId = request.id;
              } else {
                const splitRequest = await createSplitRequest(
                  `Backfilled from legacy project branch: ${project.name}`,
                );
                targetRequestId = splitRequest.id;
              }
            }

            if (!targetRequestId) {
              continue;
            }

            if (project.requestId !== targetRequestId) {
              await tx.project.update({
                where: { id: project.id },
                data: { requestId: targetRequestId },
              });
              summary.linkedProjectRows += 1;
            }

            if (targetRequestId === request.id) {
              primaryRequestHasProject = true;
            }
          }

          for (const [requestId, historyNote] of requestBackfillNotes) {
            await reconcileRequestStatus(
              tx,
              requestId,
              baseStatus,
              clientUserId,
              historyNote,
              summary,
            );
          }
        });
      } catch (error) {
        console.error(`Error backfilling lead ${lead.id}:`, error);
        errors.push({ leadId: lead.id, error });
      }
    }

    console.log("Backfill complete.");
    console.log(JSON.stringify(summary, null, 2));

    if (errors.length > 0) {
      console.error(`Backfill finished with ${errors.length} error(s).`);
      errors.slice(0, 10).forEach(({ leadId, error }) => {
        console.error(leadId, error);
      });
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error("Fatal backfill error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
