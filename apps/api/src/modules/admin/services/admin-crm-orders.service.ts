import { Injectable, NotFoundException } from "@nestjs/common";
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

@Injectable()
export class AdminCrmOrdersService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new NotFoundException("Request not found");
    }

    return {
      kind: "request" as const,
      request,
    };
  }
}
