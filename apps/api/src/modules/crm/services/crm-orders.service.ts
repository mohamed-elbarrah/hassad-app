import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CrmStage } from "@prisma/client";
import { RequestStatus } from "@hassad/shared";

import { PrismaService } from "../../../prisma/prisma.service";
import { RequestsService } from "../../requests/requests.service";
import { getCrmStageForRequestStatus } from "../../requests/request-workflow";
import { classifyCrmRecordKind } from "../../../common/business/crm-record-kind";

const orderDetailClientSelect = {
  id: true,
  kind: true,
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
      throw new NotFoundException({
        code: "REQUEST_NOT_FOUND",
        details: { id },
      });
    }

    return {
      kind: classifyCrmRecordKind(request.client),
      request,
    };
  }

  async createNote(id: string, authorId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new BadRequestException({
        code: "NOTE_CONTENT_REQUIRED",
        details: { field: "content" },
      });
    }

    const request = await this.prisma.request.findUnique({
      where: { id },
      select: { id: true, companyName: true },
    });
    const canonicalRequest = request;

    if (!canonicalRequest) {
      throw new NotFoundException({
        code: "REQUEST_NOT_FOUND",
        details: { id },
      });
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
      resultCode: "CRM_NOTE_CREATED",
    };
  }

  async updateStage(
    id: string,
    authorId: string,
    toStage: string,
    note?: string,
  ) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      select: { id: true, crmStage: true, status: true },
    });
    if (!request) {
      throw new NotFoundException({
        code: "REQUEST_NOT_FOUND",
        details: { id },
      });
    }

    const currentStage = request.crmStage ?? "NEW";
    if (currentStage === toStage) {
      throw new BadRequestException({
        code: "REQUEST_ALREADY_IN_STAGE",
        details: { stage: toStage },
      });
    }

    if (toStage === "FAILED" || toStage === "REJECTED") {
      throw new BadRequestException({
        code: "UNSUPPORTED_CRM_STAGE",
        details: { stage: toStage },
      });
    }

    const requestStatus = mapCrmStageToRequestStatus(toStage);
    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      const updated = await this.requestsService.changeStatus(
        id,
        requestStatus,
        authorId,
        note?.trim(),
        tx,
      );

      await tx.request.update({
        where: { id },
        data: {
          crmStage: getCrmStageForRequestStatus(requestStatus) as CrmStage,
        },
      });

      if (note?.trim()) {
        await tx.crmNote.create({
          data: {
            requestId: id,
            authorId,
            content: note.trim(),
          },
        });
      }

      return updated;
    });

    return {
      request: updatedRequest,
      stageCode: "CRM_STAGE_UPDATED",
      crmStage: toStage,
    };
  }
}
