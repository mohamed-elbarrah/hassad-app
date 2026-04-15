export enum ClientStatus {
  LEAD = 'LEAD',
  ACTIVE = 'ACTIVE',
  STOPPED = 'STOPPED',
}

/**
 * The 9 defined Sales Pipeline stages for the Hassad CRM.
 * Order matters: stages are traversed from NEW_LEAD → TRANSFERRED_TO_OPERATIONS.
 */
export enum PipelineStage {
  NEW_LEAD = 'NEW_LEAD',
  CONTACTED = 'CONTACTED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  REQUIREMENTS_GATHERING = 'REQUIREMENTS_GATHERING',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATION = 'NEGOTIATION',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  FIRST_PAYMENT = 'FIRST_PAYMENT',
  TRANSFERRED_TO_OPERATIONS = 'TRANSFERRED_TO_OPERATIONS',
}

/** Ordered list of pipeline stages for validation and transitions */
export const PIPELINE_STAGE_ORDER: readonly PipelineStage[] = [
  PipelineStage.NEW_LEAD,
  PipelineStage.CONTACTED,
  PipelineStage.MEETING_SCHEDULED,
  PipelineStage.REQUIREMENTS_GATHERING,
  PipelineStage.PROPOSAL_SENT,
  PipelineStage.NEGOTIATION,
  PipelineStage.CONTRACT_SIGNED,
  PipelineStage.FIRST_PAYMENT,
  PipelineStage.TRANSFERRED_TO_OPERATIONS,
] as const;

export enum BusinessType {
  RESTAURANT = 'RESTAURANT',
  CLINIC = 'CLINIC',
  STORE = 'STORE',
  SERVICE = 'SERVICE',
}

export enum ClientSource {
  AD = 'AD',
  REFERRAL = 'REFERRAL',
  WEBSITE = 'WEBSITE',
  WHATSAPP = 'WHATSAPP',
  PLATFORM = 'PLATFORM',
}
