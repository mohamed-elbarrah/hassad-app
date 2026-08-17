import { Injectable } from "@nestjs/common";
import {
  BusinessType,
  ClientSource,
} from "@hassad/shared";
import {
  ContactLogResult as PrismaContactLogResult,
  ContractStatus as PrismaContractStatus,
  CrmStage as PrismaCrmStage,
  ProposalStatus as PrismaProposalStatus,
  RequestStatus as PrismaRequestStatus,
} from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";
import { classifyCrmRecordKind } from "../../../common/business/crm-record-kind";
import {
  CrmOverviewQueryDto,
  CrmOverviewRecordDto,
  CrmOverviewStatus,
} from "../dto/crm-overview.dto";

const NOTE_REQUIRED_STATUSES: CrmOverviewStatus[] = [
  "FAILED",
  "NEGOTIATION",
  "REJECTED",
  "CANCELLED",
];

function toIso(value: Date | string | number | null | undefined) {
  if (!value) return new Date(0).toISOString();
  return new Date(value).toISOString();
}

function maxIsoDate(...values: Array<Date | string | number | null | undefined>) {
  return values
    .filter(Boolean)
    .map((value) => new Date(value as Date | string).getTime())
    .reduce((max, current) => Math.max(max, current), 0);
}

function includesText(value: string | undefined | null, query: string) {
  return Boolean(value && value.toLowerCase().includes(query));
}

function getOverviewStatusFromRequest(request: {
  crmStage?: PrismaCrmStage | null;
  status: PrismaRequestStatus;
  proposals: Array<{ status: PrismaProposalStatus; id: string }>;
  contracts: Array<{ status: PrismaContractStatus; id: string }>;
  contactLogs: Array<{ result: PrismaContactLogResult; notes?: string | null }>;
}): CrmOverviewStatus {
  if (request.crmStage) return request.crmStage as CrmOverviewStatus;
  const latestProposal = request.proposals[0] ?? null;
  const latestContract = request.contracts[0] ?? null;
  const latestContact = request.contactLogs[0] ?? null;

  if (latestContract?.status === PrismaContractStatus.CANCELLED) return "CANCELLED";
  if (latestContract?.status === PrismaContractStatus.ACTIVE) return "ACTIVE";
  if (latestContract?.status === PrismaContractStatus.SIGNED || request.status === PrismaRequestStatus.SIGNED) {
    return "SIGNED";
  }
  if (latestContract?.status === PrismaContractStatus.SENT || request.status === PrismaRequestStatus.CONTRACT_SENT) {
    return "CONTRACT_SENT";
  }

  if (latestProposal?.status === PrismaProposalStatus.REJECTED) return "REJECTED";
  if (latestProposal?.status === PrismaProposalStatus.APPROVED) return "APPROVED";
  if (latestProposal?.status === PrismaProposalStatus.SENT) return "SENT";

  switch (request.status) {
    case PrismaRequestStatus.SUBMITTED:
      return "NEW";
    case PrismaRequestStatus.QUALIFYING:
      return latestContact && latestContact.result !== PrismaContactLogResult.RESPONDED
        ? "FAILED"
        : "SCHEDULED";
    case PrismaRequestStatus.PROPOSAL_IN_PROGRESS:
      return "DONE";
    case PrismaRequestStatus.PROPOSAL_SENT:
      return "SENT";
    case PrismaRequestStatus.NEGOTIATION:
      return "NEGOTIATION";
    case PrismaRequestStatus.CONTRACT_PREPARATION:
      return "APPROVED";
    case PrismaRequestStatus.PROJECT_CREATED:
      return "ACTIVE";
    case PrismaRequestStatus.CANCELLED:
      return "CANCELLED";
    default:
      return "NEW";
  }
}

@Injectable()
export class CrmOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CrmOverviewQueryDto): Promise<CrmOverviewRecordDto[]> {
    const [requests] = await Promise.all([
      this.prisma.request.findMany({
        include: {
          assignee: { select: { name: true } },
          submitter: { select: { name: true } },
          contactLogs: {
            orderBy: { contactedAt: "desc" },
            take: 1,
            select: {
              result: true,
              notes: true,
              contactedAt: true,
            },
          },
          services: {
            include: {
              service: { select: { name: true, nameAr: true } },
            },
          },
          proposals: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              createdAt: true,
              sentAt: true,
              totalPrice: true,
            },
          },
          contracts: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              createdAt: true,
              signedAt: true,
              totalValue: true,
            },
          },
          client: {
            select: {
              id: true,
              companyName: true,
              projects: { select: { status: true } },
            },
          },
          crmNotes: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              content: true,
              createdAt: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const requestRecords = requests.map<CrmOverviewRecordDto>((request) => {
      const status = getOverviewStatusFromRequest({
        crmStage: request.crmStage,
        status: request.status,
        proposals: request.proposals.map((proposal) => ({
          id: proposal.id,
          status: proposal.status as PrismaProposalStatus,
        })),
        contracts: request.contracts.map((contract) => ({
          id: contract.id,
          status: contract.status as PrismaContractStatus,
        })),
        contactLogs: request.contactLogs.map((log) => ({
          result: log.result as PrismaContactLogResult,
          notes: log.notes,
        })),
      });

      const serviceLine = request.services
        .map((item) => item.service.nameAr || item.service.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(" + ") || "Qualification in progress";
      const latestActivityAt = maxIsoDate(
        request.updatedAt,
        request.lastContactAt,
        request.contactLogs[0]?.contactedAt,
        request.proposals[0]?.sentAt,
        request.proposals[0]?.createdAt,
        request.contracts[0]?.signedAt,
        request.contracts[0]?.createdAt,
        request.crmNotes[0]?.createdAt,
      );
      const note =
        request.crmNotes[0]?.content?.trim() ||
        request.notes?.trim() ||
        request.internalNotes?.trim() ||
        request.contactLogs[0]?.notes?.trim() ||
        "";

      return {
        id: request.id,
        kind: classifyCrmRecordKind(request.client?.projects),
        status,
        companyName: request.companyName,
        contactName: request.contactName,
        phoneWhatsapp: request.phoneWhatsapp,
        businessName: request.businessName,
        businessType: request.businessType as BusinessType,
        source: request.source as ClientSource,
        owner: request.assignee?.name || request.submitter?.name || "Unassigned",
        serviceLine,
        note,
        lastActivityAt: toIso(latestActivityAt || request.updatedAt),
        createdAt: toIso(request.createdAt),
        attemptCount: request.contactAttemptCount,
        requiresNote: NOTE_REQUIRED_STATUSES.includes(status),
        proposalId: request.proposals[0]?.id ?? null,
        contractId: request.contracts[0]?.id ?? null,
      };
    });

    const records = [...requestRecords]
      .filter((record) => {
        if (query.filter === "leads") return record.kind === "lead";
        if (query.filter === "orders") return record.kind === "order";
        return true;
      })
      .filter((record) => {
        const normalized = query.search?.trim().toLowerCase();
        if (!normalized) return true;

        return [
          record.companyName,
          record.contactName,
          record.businessName,
          record.owner,
          record.serviceLine,
          record.note,
          record.phoneWhatsapp,
          String(record.kind),
          record.status,
        ].some((value) => includesText(value, normalized));
      })
      .sort((left, right) => new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime());

    return records;
  }
}
