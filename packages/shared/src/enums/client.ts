export enum ClientStatus {
  LEAD = "LEAD",
  ACTIVE = "ACTIVE",
  STOPPED = "STOPPED",
}

/**
 * The 9 defined Sales Pipeline stages for the Hassad CRM.
 * Order matters: stages are traversed from NEW_LEAD → HANDOVER.
 */
export enum PipelineStage {
  NEW_LEAD = "NEW_LEAD",
  CONTACTED = "CONTACTED",
  MEETING_SCHEDULED = "MEETING_SCHEDULED",
  REQUIREMENTS_GATHERING = "REQUIREMENTS_GATHERING",
  PROPOSAL_SENT = "PROPOSAL_SENT",
  NEGOTIATION = "NEGOTIATION",
  WAITING_FOR_SIGNATURE = "WAITING_FOR_SIGNATURE",
  CONTRACTED_WON = "CONTRACTED_WON",
  HANDOVER = "HANDOVER",
}

/** Ordered list of pipeline stages for validation and transitions */
export const PIPELINE_STAGE_ORDER: readonly PipelineStage[] = [
  PipelineStage.NEW_LEAD,
  PipelineStage.CONTACTED,
  PipelineStage.MEETING_SCHEDULED,
  PipelineStage.REQUIREMENTS_GATHERING,
  PipelineStage.PROPOSAL_SENT,
  PipelineStage.NEGOTIATION,
  PipelineStage.WAITING_FOR_SIGNATURE,
  PipelineStage.CONTRACTED_WON,
  PipelineStage.HANDOVER,
] as const;

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
