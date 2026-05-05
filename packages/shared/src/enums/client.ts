export enum BusinessType {
  RESTAURANT = "RESTAURANT",
  CLINIC = "CLINIC",
  STORE = "STORE",
  SERVICE = "SERVICE",
  OTHER = "OTHER",
}

export enum ClientSource {
  AD = "AD",
  REFERRAL = "REFERRAL",
  WEBSITE = "WEBSITE",
  WHATSAPP = "WHATSAPP",
  PLATFORM = "PLATFORM",
}

export enum PipelineStage {
  NEW = "NEW",
  INTRO_SENT = "INTRO_SENT",
  CALL_ATTEMPT = "CALL_ATTEMPT",
  MEETING_SCHEDULED = "MEETING_SCHEDULED",
  MEETING_DONE = "MEETING_DONE",
  PROPOSAL_SENT = "PROPOSAL_SENT",
  FOLLOW_UP = "FOLLOW_UP",
  APPROVED = "APPROVED",
  CONTRACT_SIGNED = "CONTRACT_SIGNED",
}

export enum RequestStatus {
  SUBMITTED = "SUBMITTED",
  QUALIFYING = "QUALIFYING",
  PROPOSAL_IN_PROGRESS = "PROPOSAL_IN_PROGRESS",
  PROPOSAL_SENT = "PROPOSAL_SENT",
  NEGOTIATION = "NEGOTIATION",
  CONTRACT_PREPARATION = "CONTRACT_PREPARATION",
  CONTRACT_SENT = "CONTRACT_SENT",
  SIGNED = "SIGNED",
  PROJECT_CREATED = "PROJECT_CREATED",
  CANCELLED = "CANCELLED",
}

export const PIPELINE_UI_MAP = {
  [PipelineStage.NEW]: "New Lead",
  [PipelineStage.INTRO_SENT]: "Contacted",
  [PipelineStage.CALL_ATTEMPT]: "Follow-up Attempt",
  [PipelineStage.MEETING_SCHEDULED]: "Meeting Scheduled",
  [PipelineStage.MEETING_DONE]: "Meeting Completed",
  [PipelineStage.PROPOSAL_SENT]: "Proposal Sent",
  [PipelineStage.FOLLOW_UP]: "Negotiation / Follow-up",
  [PipelineStage.APPROVED]: "Approved",
  [PipelineStage.CONTRACT_SIGNED]: "Won (Contract Signed)",
};

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  PipelineStage.NEW,
  PipelineStage.CALL_ATTEMPT,
  PipelineStage.INTRO_SENT,
  PipelineStage.MEETING_SCHEDULED,
  PipelineStage.MEETING_DONE,
  PipelineStage.PROPOSAL_SENT,
  PipelineStage.FOLLOW_UP,
  PipelineStage.APPROVED,
  PipelineStage.CONTRACT_SIGNED,
];

export enum ClientStatus {
  LEAD = "LEAD",
  ACTIVE = "ACTIVE",
  STOPPED = "STOPPED",
}

export enum ProposalStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  APPROVED = "APPROVED",
  REVISION_REQUESTED = "REVISION_REQUESTED",
  REJECTED = "REJECTED",
}

export enum ContractStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  SIGNED = "SIGNED",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum ContactLogType {
  CALL = "CALL",
  WHATSAPP = "WHATSAPP",
  MEETING = "MEETING",
  EMAIL = "EMAIL",
}

export enum ContactLogResult {
  NO_RESPONSE = "NO_RESPONSE",
  RESPONDED = "RESPONDED",
  BUSY = "BUSY",
  WRONG_NUMBER = "WRONG_NUMBER",
}

export enum AutomationStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum ContractType {
  MONTHLY_RETAINER = "MONTHLY_RETAINER",
  FIXED_PROJECT = "FIXED_PROJECT",
  ONE_TIME_SERVICE = "ONE_TIME_SERVICE",
}

export enum RenewalAlertType {
  SIXTY_DAYS = "SIXTY_DAYS",
  THIRTY_DAYS = "THIRTY_DAYS",
  SEVEN_DAYS = "SEVEN_DAYS",
}

export enum ContactOutcome {
  NO_RESPONSE = "NO_RESPONSE",
  RESPONDED = "RESPONDED",
  BUSY = "BUSY",
  WRONG_NUMBER = "WRONG_NUMBER",
}

export enum NotificationType {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
  SYSTEM = "SYSTEM",
}
