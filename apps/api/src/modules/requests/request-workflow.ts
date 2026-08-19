import { CrmStage } from "@prisma/client";
import { RequestStatus } from "@hassad/shared";

export const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.SUBMITTED]: [
    RequestStatus.QUALIFYING,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.QUALIFYING]: [
    RequestStatus.PROPOSAL_IN_PROGRESS,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.PROPOSAL_IN_PROGRESS]: [
    RequestStatus.PROPOSAL_SENT,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.PROPOSAL_SENT]: [
    RequestStatus.NEGOTIATION,
    RequestStatus.PROPOSAL_IN_PROGRESS,
    RequestStatus.CONTRACT_PREPARATION,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.NEGOTIATION]: [
    RequestStatus.PROPOSAL_IN_PROGRESS,
    RequestStatus.CONTRACT_PREPARATION,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.CONTRACT_PREPARATION]: [
    RequestStatus.CONTRACT_SENT,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.CONTRACT_SENT]: [
    RequestStatus.CONTRACT_PREPARATION,
    RequestStatus.SIGNED,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.SIGNED]: [
    RequestStatus.PROJECT_CREATED,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.PROJECT_CREATED]: [],
  [RequestStatus.CANCELLED]: [],
};

export const REQUEST_PIPELINE_STAGES = [
  {
    code: RequestStatus.SUBMITTED,
    order: 1,
    groupCode: "INTAKE",
    isTerminal: false,
  },
  {
    code: RequestStatus.QUALIFYING,
    order: 2,
    groupCode: "INTAKE",
    isTerminal: false,
  },
  {
    code: RequestStatus.PROPOSAL_IN_PROGRESS,
    order: 3,
    groupCode: "PROPOSAL",
    isTerminal: false,
  },
  {
    code: RequestStatus.PROPOSAL_SENT,
    order: 4,
    groupCode: "PROPOSAL",
    isTerminal: false,
  },
  {
    code: RequestStatus.NEGOTIATION,
    order: 5,
    groupCode: "PROPOSAL",
    isTerminal: false,
  },
  {
    code: RequestStatus.CONTRACT_PREPARATION,
    order: 6,
    groupCode: "CONTRACT",
    isTerminal: false,
  },
  {
    code: RequestStatus.CONTRACT_SENT,
    order: 7,
    groupCode: "CONTRACT",
    isTerminal: false,
  },
  { code: RequestStatus.SIGNED, order: 8, groupCode: "WON", isTerminal: false },
  {
    code: RequestStatus.PROJECT_CREATED,
    order: 9,
    groupCode: "WON",
    isTerminal: true,
  },
  {
    code: RequestStatus.CANCELLED,
    order: 10,
    groupCode: "CANCELLED",
    isTerminal: true,
  },
] as const;

export const REQUEST_PIPELINE_GROUPS = {
  INTAKE: [RequestStatus.SUBMITTED, RequestStatus.QUALIFYING],
  PROPOSAL: [
    RequestStatus.PROPOSAL_IN_PROGRESS,
    RequestStatus.PROPOSAL_SENT,
    RequestStatus.NEGOTIATION,
  ],
  CONTRACT: [RequestStatus.CONTRACT_PREPARATION, RequestStatus.CONTRACT_SENT],
  WON: [RequestStatus.SIGNED, RequestStatus.PROJECT_CREATED],
  CANCELLED: [RequestStatus.CANCELLED],
} as const;

export type RequestPipelineGroup = keyof typeof REQUEST_PIPELINE_GROUPS;

export const TERMINAL_REQUEST_STATUSES = [
  RequestStatus.PROJECT_CREATED,
  RequestStatus.CANCELLED,
] as const;

export function getAllowedRequestTransitions(status: RequestStatus) {
  return REQUEST_TRANSITIONS[status] ?? [];
}

export function getCrmStageForRequestStatus(status: RequestStatus): CrmStage {
  switch (status) {
    case RequestStatus.QUALIFYING:
      return CrmStage.SCHEDULED;
    case RequestStatus.PROPOSAL_IN_PROGRESS:
      return CrmStage.DONE;
    case RequestStatus.PROPOSAL_SENT:
      return CrmStage.SENT;
    case RequestStatus.NEGOTIATION:
      return CrmStage.NEGOTIATION;
    case RequestStatus.CONTRACT_PREPARATION:
      return CrmStage.APPROVED;
    case RequestStatus.CONTRACT_SENT:
      return CrmStage.CONTRACT_SENT;
    case RequestStatus.SIGNED:
      return CrmStage.SIGNED;
    case RequestStatus.PROJECT_CREATED:
      return CrmStage.ACTIVE;
    case RequestStatus.CANCELLED:
      return CrmStage.CANCELLED;
    case RequestStatus.SUBMITTED:
    default:
      return CrmStage.NEW;
  }
}

export function getStatusesForPipelineGroup(group: RequestPipelineGroup) {
  return REQUEST_PIPELINE_GROUPS[group];
}
