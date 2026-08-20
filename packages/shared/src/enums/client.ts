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

export const BUSINESS_TYPE_AR: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم",
  [BusinessType.CLINIC]: "عيادة",
  [BusinessType.STORE]: "متجر",
  [BusinessType.SERVICE]: "خدمة",
  [BusinessType.OTHER]: "أخرى",
};

export const CLIENT_SOURCE_AR: Record<ClientSource, string> = {
  [ClientSource.AD]: "إعلان",
  [ClientSource.REFERRAL]: "توصية",
  [ClientSource.WEBSITE]: "الموقع الإلكتروني",
  [ClientSource.WHATSAPP]: "واتساب",
  [ClientSource.PLATFORM]: "المنصة",
};

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

export enum CrmStage {
  NEW = "NEW",
  SCHEDULED = "SCHEDULED",
  DONE = "DONE",
  FAILED = "FAILED",
  SENT = "SENT",
  NEGOTIATION = "NEGOTIATION",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CONTRACT_SENT = "CONTRACT_SENT",
  SIGNED = "SIGNED",
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
}

export const CRM_STAGE_UI_MAP: Record<CrmStage, string> = {
  [CrmStage.NEW]: "New",
  [CrmStage.SCHEDULED]: "Scheduled",
  [CrmStage.DONE]: "Done",
  [CrmStage.FAILED]: "Failed",
  [CrmStage.SENT]: "Proposal sent",
  [CrmStage.NEGOTIATION]: "Negotiation",
  [CrmStage.APPROVED]: "Approved",
  [CrmStage.REJECTED]: "Rejected",
  [CrmStage.CONTRACT_SENT]: "Contract sent",
  [CrmStage.SIGNED]: "Signed",
  [CrmStage.ACTIVE]: "Active",
  [CrmStage.CANCELLED]: "Cancelled",
};

export const REQUEST_STATUS_AR: Record<RequestStatus, string> = {
  [RequestStatus.SUBMITTED]: "مقدم",
  [RequestStatus.QUALIFYING]: "قيد التأهيل",
  [RequestStatus.PROPOSAL_IN_PROGRESS]: "إعداد العرض",
  [RequestStatus.PROPOSAL_SENT]: "أرسل العرض",
  [RequestStatus.NEGOTIATION]: "تفاوض",
  [RequestStatus.CONTRACT_PREPARATION]: "إعداد العقد",
  [RequestStatus.CONTRACT_SENT]: "أرسل العقد",
  [RequestStatus.SIGNED]: "موقّع",
  [RequestStatus.PROJECT_CREATED]: "تم إنشاء المشروع",
  [RequestStatus.CANCELLED]: "ملغي",
};

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

export const PIPELINE_STAGE_AR: Record<PipelineStage, string> = {
  [PipelineStage.NEW]: "جديد",
  [PipelineStage.INTRO_SENT]: "أُرسل التعريف",
  [PipelineStage.CALL_ATTEMPT]: "محاولة اتصال",
  [PipelineStage.MEETING_SCHEDULED]: "موعد محدد",
  [PipelineStage.MEETING_DONE]: "تم الاجتماع",
  [PipelineStage.PROPOSAL_SENT]: "أُرسل العرض",
  [PipelineStage.FOLLOW_UP]: "متابعة",
  [PipelineStage.APPROVED]: "تمت الموافقة",
  [PipelineStage.CONTRACT_SIGNED]: "تم التوقيع",
};

export enum ClientStatus {
  LEAD = "LEAD",
  ACTIVE = "ACTIVE",
  STOPPED = "STOPPED",
}

export const CLIENT_STATUS_AR: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: "عميل محتمل",
  [ClientStatus.ACTIVE]: "نشط",
  [ClientStatus.STOPPED]: "متوقف",
};

export enum DurationUnit {
  DAYS = "DAYS",
  WEEKS = "WEEKS",
  MONTHS = "MONTHS",
}

export enum ProposalStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  APPROVED = "APPROVED",
  REVISION_REQUESTED = "REVISION_REQUESTED",
  REJECTED = "REJECTED",
}

export const PROPOSAL_STATUS_AR: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "مسودة",
  [ProposalStatus.SENT]: "مرسل",
  [ProposalStatus.APPROVED]: "مقبول",
  [ProposalStatus.REVISION_REQUESTED]: "طلب مراجعة",
  [ProposalStatus.REJECTED]: "مرفوض",
};

export enum ContractStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  SIGNED = "SIGNED",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export const CONTRACT_STATUS_AR: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: "مسودة",
  [ContractStatus.SENT]: "مرسل",
  [ContractStatus.SIGNED]: "موقّع",
  [ContractStatus.ACTIVE]: "نشط",
  [ContractStatus.ON_HOLD]: "معلق",
  [ContractStatus.COMPLETED]: "مكتمل",
  [ContractStatus.EXPIRED]: "منتهي",
  [ContractStatus.CANCELLED]: "ملغي",
};

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
  NOT_INTERESTED = "NOT_INTERESTED",
}

export enum AutomationStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum ContractType {
  MONTHLY_RETAINER = "MONTHLY_RETAINER",
  FIXED_PROJECT = "FIXED_PROJECT",
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

export enum NotificationEventType {
  // Proposals
  PROPOSAL_SENT = "PROPOSAL_SENT",
  PROPOSAL_APPROVED = "PROPOSAL_APPROVED",
  PROPOSAL_REJECTED = "PROPOSAL_REJECTED",
  PROPOSAL_APPROVED_BY_CLIENT = "PROPOSAL_APPROVED_BY_CLIENT",
  PROPOSAL_REVISION_REQUESTED = "PROPOSAL_REVISION_REQUESTED",
  // Contracts
  CONTRACT_SENT = "CONTRACT_SENT",
  CONTRACT_SIGNED = "CONTRACT_SIGNED",
  CONTRACT_ACTIVATED = "CONTRACT_ACTIVATED",
  CONTRACT_CANCELLED = "CONTRACT_CANCELLED",
  CONTRACT_EXPIRING = "CONTRACT_EXPIRING",
  CONTRACT_EXPIRED = "CONTRACT_EXPIRED",
  // Projects
  PROJECT_CREATED = "PROJECT_CREATED",
  PROJECT_CREATED_FROM_CONTRACT = "PROJECT_CREATED_FROM_CONTRACT",
  PROJECT_STATUS_CHANGED = "PROJECT_STATUS_CHANGED",
  // Tasks
  TASK_ASSIGNED = "TASK_ASSIGNED",
  TASK_STARTED = "TASK_STARTED",
  TASK_SUBMITTED = "TASK_SUBMITTED",
  TASK_APPROVED = "TASK_APPROVED",
  TASK_REJECTED = "TASK_REJECTED",
  TASK_UPDATED = "TASK_UPDATED",
  TASK_COMMENT_ADDED = "TASK_COMMENT_ADDED",
  // Deliverables
  DELIVERABLE_READY = "DELIVERABLE_READY",
  DELIVERABLE_APPROVED = "DELIVERABLE_APPROVED",
  DELIVERABLE_REVISION = "DELIVERABLE_REVISION",
  DELIVERABLE_APPROVAL = "DELIVERABLE_APPROVAL",
  // Finance
  INVOICE_CREATED = "INVOICE_CREATED",
  INVOICE_SENT = "INVOICE_SENT",
  INVOICE_PAID = "INVOICE_PAID",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  // Campaigns
  MARKETING_CAMPAIGN_CREATED = "MARKETING_CAMPAIGN_CREATED",
  MARKETING_METRICS_UPDATED = "MARKETING_METRICS_UPDATED",
  MARKETING_CAMPAIGN_STATUS_CHANGED = "MARKETING_CAMPAIGN_STATUS_CHANGED",
  MARKETING_OPTIMIZATION_REQUIRED = "MARKETING_OPTIMIZATION_REQUIRED",
  // Chat
  NEW_MESSAGE = "NEW_MESSAGE",
  // Action items
  ACTION_REQUIRED = "ACTION_REQUIRED",
}
