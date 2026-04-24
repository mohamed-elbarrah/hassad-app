export enum ClientStatus {
  LEAD = "LEAD",
  ACTIVE = "ACTIVE",
  STOPPED = "STOPPED",
}

/**
 * The 9 defined Sales Pipeline stages for the Hassad CRM.
 * Order matters: stages are traversed from NEW_LEAD → CONTRACT_SIGNED.
 */
export enum PipelineStage {
  NEW_LEAD = "NEW_LEAD",
  INTRO_MESSAGE = "INTRO_MESSAGE",
  CONTACT_ATTEMPT = "CONTACT_ATTEMPT",
  MEETING_SCHEDULED = "MEETING_SCHEDULED",
  MEETING_HELD = "MEETING_HELD",
  PROPOSAL = "PROPOSAL",
  FOLLOW_UP = "FOLLOW_UP",
  APPROVAL = "APPROVAL",
  CONTRACT_SIGNED = "CONTRACT_SIGNED",
}

/** Ordered list of pipeline stages for validation and transitions */
export const PIPELINE_STAGE_ORDER: readonly PipelineStage[] = [
  PipelineStage.NEW_LEAD,
  PipelineStage.INTRO_MESSAGE,
  PipelineStage.CONTACT_ATTEMPT,
  PipelineStage.MEETING_SCHEDULED,
  PipelineStage.MEETING_HELD,
  PipelineStage.PROPOSAL,
  PipelineStage.FOLLOW_UP,
  PipelineStage.APPROVAL,
  PipelineStage.CONTRACT_SIGNED,
] as const;

export enum ContactOutcome {
  NO_RESPONSE = "NO_RESPONSE",
  RESPONDED = "RESPONDED",
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
}

export enum BusinessType {
  RESTAURANT = "RESTAURANT",
  CLINIC = "CLINIC",
  STORE = "STORE",
  SERVICE = "SERVICE",
}

export enum ClientSource {
  AD = "AD",
  REFERRAL = "REFERRAL",
  WEBSITE = "WEBSITE",
  WHATSAPP = "WHATSAPP",
  PLATFORM = "PLATFORM",
}
