import { Injectable } from "@nestjs/common";
import { RequestStatus } from "@hassad/shared";
import { PipelineStage } from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";
import { badRequest, notFound } from "../../../common/errors/domain-errors";
import { RequestsService } from "../../requests/requests.service";

const orderDetailClientSelect = {
  id: true,
  companyName: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      lastLoginAt: true,
    },
  },
  totalProjects: true,
  activeProjects: true,
  completedProjects: true,
  totalContractValue: true,
  totalPaid: true,
} as const;

const orderDetailUserSelect = {
  id: true,
  name: true,
  email: true,
} as const;

const orderDetailContactLogSelect = {
  id: true,
  type: true,
  result: true,
  notes: true,
  contactedAt: true,
  user: {
    select: orderDetailUserSelect,
  },
} as const;

const orderDetailStatusHistorySelect = {
  id: true,
  fromStatus: true,
  toStatus: true,
  changedAt: true,
  note: true,
  changer: {
    select: orderDetailUserSelect,
  },
} as const;

const orderDetailPipelineHistorySelect = {
  id: true,
  fromStage: true,
  toStage: true,
  changedAt: true,
  changedBy: true,
  changer: {
    select: orderDetailUserSelect,
  },
} as const;

const orderDetailServiceInclude = {
  service: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
} as const;

const orderDetailProposalSelect = {
  id: true,
  title: true,
  status: true,
  totalPrice: true,
  createdAt: true,
  sentAt: true,
} as const;

const orderDetailContractSelect = {
  id: true,
  title: true,
  status: true,
  totalValue: true,
  createdAt: true,
  signedAt: true,
} as const;

const orderDetailNoteSelect = {
  id: true,
  content: true,
  isInternal: true,
  createdAt: true,
  author: {
    select: orderDetailUserSelect,
  },
} as const;

function mapRequestStatusToStage(status: RequestStatus): PipelineStage {
  switch (status) {
    case RequestStatus.SUBMITTED:
      return PipelineStage.NEW;
    case RequestStatus.QUALIFYING:
      return PipelineStage.CALL_ATTEMPT;
    case RequestStatus.PROPOSAL_IN_PROGRESS:
      return PipelineStage.MEETING_DONE;
    case RequestStatus.PROPOSAL_SENT:
      return PipelineStage.PROPOSAL_SENT;
    case RequestStatus.NEGOTIATION:
      return PipelineStage.FOLLOW_UP;
    case RequestStatus.CONTRACT_PREPARATION:
    case RequestStatus.CONTRACT_SENT:
      return PipelineStage.APPROVED;
    case RequestStatus.SIGNED:
    case RequestStatus.PROJECT_CREATED:
      return PipelineStage.CONTRACT_SIGNED;
    case RequestStatus.CANCELLED:
      return PipelineStage.CALL_ATTEMPT;
    default:
      return PipelineStage.NEW;
  }
}

function mapCrmStageToPipelineStage(stage: string): PipelineStage {
  switch (stage) {
    case "SCHEDULED":
      return PipelineStage.MEETING_SCHEDULED;
    case "DONE":
      return PipelineStage.MEETING_DONE;
    case "FAILED":
      return PipelineStage.CALL_ATTEMPT;
    case "SENT":
      return PipelineStage.PROPOSAL_SENT;
    case "NEGOTIATION":
      return PipelineStage.FOLLOW_UP;
    case "APPROVED":
      return PipelineStage.APPROVED;
    case "CONTRACT_SENT":
      return PipelineStage.APPROVED;
    case "SIGNED":
    case "ACTIVE":
      return PipelineStage.CONTRACT_SIGNED;
    case "REJECTED":
    case "CANCELLED":
      return PipelineStage.CALL_ATTEMPT;
    case "NEW":
    default:
      return PipelineStage.NEW;
  }
}

function mapCrmStageToRequestStatus(stage: string): RequestStatus {
  switch (stage) {
    case "SCHEDULED":
      return RequestStatus.QUALIFYING;
    case "DONE":
      return RequestStatus.PROPOSAL_IN_PROGRESS;
    case "FAILED":
      return RequestStatus.QUALIFYING;
    case "SENT":
      return RequestStatus.PROPOSAL_SENT;
    case "NEGOTIATION":
      return RequestStatus.NEGOTIATION;
    case "APPROVED":
      return RequestStatus.CONTRACT_PREPARATION;
    case "CONTRACT_SENT":
      return RequestStatus.CONTRACT_SENT;
    case "SIGNED":
      return RequestStatus.SIGNED;
    case "ACTIVE":
      return RequestStatus.PROJECT_CREATED;
    case "REJECTED":
    case "CANCELLED":
      return RequestStatus.CANCELLED;
    case "NEW":
    default:
      return RequestStatus.SUBMITTED;
  }
}

function humanizeCrmStage(stage: string) {
  switch (stage) {
    case "NEW":
      return "New";
    case "SCHEDULED":
      return "Scheduled";
    case "DONE":
      return "Done";
    case "FAILED":
      return "Failed";
    case "SENT":
      return "Proposal sent";
    case "NEGOTIATION":
      return "Negotiation";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "CONTRACT_SENT":
      return "Contract sent";
    case "SIGNED":
      return "Signed";
    case "ACTIVE":
      return "Active";
    case "CANCELLED":
      return "Cancelled";
    default:
      return stage.replaceAll("_", " ");
  }
}

@Injectable()
export class CrmOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestsService: RequestsService,
  ) {}

  async findOne(id: string) {
    const [request] = await Promise.all([
      this.prisma.request.findUnique({
        where: { id },
        include: {
          client: { select: orderDetailClientSelect },
          assignee: { select: orderDetailUserSelect },
          submitter: { select: orderDetailUserSelect },
          contactLogs: {
            orderBy: { contactedAt: "desc" },
            select: orderDetailContactLogSelect,
          },
          statusHistory: {
            orderBy: { changedAt: "desc" },
            select: orderDetailStatusHistorySelect,
          },
          services: {
            include: orderDetailServiceInclude,
          },
          proposals: {
            orderBy: { createdAt: "desc" },
            select: orderDetailProposalSelect,
          },
          contracts: {
            orderBy: { createdAt: "desc" },
            select: orderDetailContractSelect,
          },
          crmNotes: {
            orderBy: { createdAt: "desc" },
            take: 20,
            select: orderDetailNoteSelect,
          },
        },
      }),
    ]);

    if (!request) {
      throw notFound("REQUEST_NOT_FOUND", "Request not found");
    }

    return {
      kind: "request" as const,
      request,
    };
  }

  async createNote(id: string, authorId: string, content: string) {
    const trimmed = typeof content === "string" ? content.trim() : "";
    if (!trimmed) {
      throw badRequest("ORDER_NOTE_REQUIRED", "Note content is required");
    }

    const request = await this.prisma.request.findUnique({
      where: { id },
      select: { id: true, companyName: true },
    });
    const canonicalRequest = request;

    if (!canonicalRequest) {
      throw notFound(
        "REQUEST_CANONICAL_NOT_FOUND",
        "Canonical request not found for legacy CRM record",
      );
    }

    const note = await this.prisma.crmNote.create({
      data: { requestId: canonicalRequest.id, authorId, content: trimmed },
      select: {
        id: true,
        content: true,
        isInternal: true,
        createdAt: true,
        author: { select: orderDetailUserSelect },
      },
    });

    return {
      note,
      toast: {
        type: "success" as const,
        title: "Note saved",
        description: `Added a note to ${canonicalRequest.companyName}.`,
      },
    };
  }

  async updateStage(
    id: string,
    authorId: string,
    toStage: string,
    note?: string,
  ) {
    const content = note?.trim();
    const transition = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM "requests"
        WHERE id = ${id}
        FOR UPDATE
      `;

      const request = await tx.request.findUnique({
        where: { id },
        select: {
          id: true,
          companyName: true,
          crmStage: true,
          status: true,
        },
      });
      if (!request) {
        throw notFound("REQUEST_NOT_FOUND", "Request not found");
      }

      const currentStage = request.crmStage ?? "NEW";
      if (currentStage === toStage) {
        throw badRequest(
          "ORDER_STAGE_UNCHANGED",
          "Order is already in this stage",
        );
      }

      const requestStatus = mapCrmStageToRequestStatus(toStage);
      await this.requestsService.updateStatus(
        request.id,
        requestStatus,
        authorId,
        content,
        tx,
      );
      await tx.request.update({
        where: { id: request.id },
        data: { crmStage: toStage as any },
      });
      if (content) {
        await tx.crmNote.create({
          data: { requestId: request.id, authorId, content },
        });
      }

      return {
        request,
        requestStatus,
        fromStageLabel: humanizeCrmStage(currentStage),
        toStageLabel: humanizeCrmStage(toStage),
      };
    });

    return {
      action: "stage_updated" as const,
      request: {
        id: transition.request.id,
        crmStage: toStage,
        status: transition.requestStatus,
      },
      toast: {
        type: "success" as const,
        title: "Stage updated",
        description: `${transition.request.companyName} changed from ${transition.fromStageLabel} to ${transition.toStageLabel}.`,
      },
    };
  }
}
