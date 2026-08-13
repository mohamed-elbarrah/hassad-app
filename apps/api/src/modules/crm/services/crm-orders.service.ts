import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PipelineStage, RequestStatus } from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";

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
      nameAr: true,
      description: true,
      descriptionAr: true,
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
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const [request, lead] = await Promise.all([
      this.prisma.request.findUnique({
        where: { id },
        include: {
          client: { select: orderDetailClientSelect },
          assignee: { select: orderDetailUserSelect },
          submitter: { select: orderDetailUserSelect },
          lead: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              phoneWhatsapp: true,
              email: true,
              businessName: true,
              businessType: true,
              source: true,
              notes: true,
              crmStage: true,
              assignedTo: true,
              pipelineStage: true,
              contactAttemptCount: true,
              lastContactAt: true,
              createdAt: true,
              updatedAt: true,
              assignee: { select: orderDetailUserSelect },
              creator: { select: orderDetailUserSelect },
              client: { select: orderDetailClientSelect },
              contactLogs: {
                orderBy: { contactedAt: "desc" },
                select: orderDetailContactLogSelect,
              },
              pipelineHistory: {
                orderBy: { changedAt: "desc" },
                select: orderDetailPipelineHistorySelect,
              },
              services: {
                include: orderDetailServiceInclude,
              },
              proposals: {
                orderBy: { createdAt: "desc" },
                select: orderDetailProposalSelect,
              },
            },
          },
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
      this.prisma.lead.findUnique({
        where: { id },
        include: {
          client: { select: orderDetailClientSelect },
          assignee: { select: orderDetailUserSelect },
          creator: { select: orderDetailUserSelect },
          request: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              phoneWhatsapp: true,
              email: true,
              businessName: true,
              businessType: true,
              source: true,
              notes: true,
              internalNotes: true,
              crmStage: true,
              status: true,
              contactAttemptCount: true,
              lastContactAt: true,
              createdAt: true,
              updatedAt: true,
              assignee: { select: orderDetailUserSelect },
              submitter: { select: orderDetailUserSelect },
              client: { select: orderDetailClientSelect },
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
          },
          contactLogs: {
            orderBy: { contactedAt: "desc" },
            select: orderDetailContactLogSelect,
          },
          pipelineHistory: {
            orderBy: { changedAt: "desc" },
            select: orderDetailPipelineHistorySelect,
          },
          services: {
            include: orderDetailServiceInclude,
          },
          proposals: {
            orderBy: { createdAt: "desc" },
            select: orderDetailProposalSelect,
          },
          crmNotes: {
            orderBy: { createdAt: "desc" },
            take: 20,
            select: orderDetailNoteSelect,
          },
        },
      }),
    ]);

    if (!request && !lead) {
      throw new NotFoundException("Order not found");
    }

    if (request) {
      return {
        kind: "request" as const,
        request,
        lead: request.lead,
      };
    }

    return {
      kind: "lead" as const,
      request: lead?.request ?? null,
      lead,
    };
  }

  async createNote(id: string, authorId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new BadRequestException("Note content is required");
    }

    const request = await this.prisma.request.findUnique({
      where: { id },
      select: { id: true, companyName: true },
    });
    const lead = request
      ? null
      : await this.prisma.lead.findUnique({
          where: { id },
          select: { id: true, companyName: true },
        });

    if (!request && !lead) {
      throw new NotFoundException("Order not found");
    }

    const note = await this.prisma.crmNote.create({
      data: request
        ? { requestId: request.id, authorId, content: trimmed }
        : { leadId: lead!.id, authorId, content: trimmed },
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
        description: `Added a note to ${request?.companyName ?? lead?.companyName ?? "this record"}.`,
      },
    };
  }

  async updateStage(id: string, authorId: string, toStage: string, note?: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        crmStage: true,
        status: true,
        lead: {
          select: {
            id: true,
            crmStage: true,
            pipelineStage: true,
          },
        },
      },
    });
    const lead = request
      ? null
      : await this.prisma.lead.findUnique({
          where: { id },
          select: {
            id: true,
            companyName: true,
            crmStage: true,
            pipelineStage: true,
            request: {
              select: {
                id: true,
                companyName: true,
                crmStage: true,
                status: true,
              },
            },
          },
        });

    if (!request && !lead) {
      throw new NotFoundException('Order not found');
    }

    const currentStage = request
      ? request.crmStage ?? request.lead?.crmStage ?? 'NEW'
      : lead?.crmStage ?? lead?.request?.crmStage ?? 'NEW';

    if (currentStage === toStage) {
      throw new BadRequestException('Order is already in this stage');
    }

    const content = note?.trim();
    const requestStatus = mapCrmStageToRequestStatus(toStage);
    const pipelineStage = mapCrmStageToPipelineStage(toStage);
    const fromStageLabel = humanizeCrmStage(currentStage);
    const toStageLabel = humanizeCrmStage(toStage);
    const targetName = request?.companyName ?? lead?.companyName ?? "this record";

    await this.prisma.$transaction(async (tx) => {
      if (request) {
        await tx.request.update({
          where: { id: request.id },
          data: { crmStage: toStage as any, status: requestStatus },
        });
        await tx.requestStatusHistory.create({
          data: {
            requestId: request.id,
            fromStatus: request.status,
            toStatus: requestStatus,
            changedBy: authorId,
            note: content,
          },
        });
        if (request.lead?.id) {
          await tx.lead.update({
            where: { id: request.lead.id },
            data: { crmStage: toStage as any, pipelineStage },
          });
          await tx.leadPipelineHistory.create({
            data: {
              leadId: request.lead.id,
              fromStage: request.lead.pipelineStage,
              toStage: pipelineStage,
              changedBy: authorId,
            },
          });
        }
        if (content) {
          await tx.crmNote.create({ data: { requestId: request.id, authorId, content } });
        }
        return;
      }

      await tx.lead.update({
        where: { id: lead!.id },
        data: { crmStage: toStage as any, pipelineStage },
      });
      await tx.leadPipelineHistory.create({
        data: {
          leadId: lead!.id,
          fromStage: lead!.pipelineStage,
          toStage: pipelineStage,
          changedBy: authorId,
        },
      });
      if (lead?.request?.id) {
        await tx.request.update({
          where: { id: lead.request.id },
          data: { crmStage: toStage as any, status: requestStatus },
        });
        await tx.requestStatusHistory.create({
          data: {
            requestId: lead.request.id,
            fromStatus: lead.request.status,
            toStatus: requestStatus,
            changedBy: authorId,
            note: content,
          },
        });
      }
      if (content) {
        await tx.crmNote.create({ data: { leadId: lead!.id, authorId, content } });
      }
    });

    return {
      success: true,
      toast: {
        type: "success" as const,
        title: "Stage updated",
        description: `${targetName} changed from ${fromStageLabel} to ${toStageLabel}.`,
      },
    };
  }
}
