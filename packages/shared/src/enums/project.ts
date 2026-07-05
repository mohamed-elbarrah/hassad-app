export enum ProjectStatus {
  PLANNING = "PLANNING",
  PENDING_ACTIVATION = "PENDING_ACTIVATION",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  AWAITING_REVIEW = "AWAITING_REVIEW",
  NEEDS_REVISION = "NEEDS_REVISION",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export const PROJECT_STATUS_AR: Record<ProjectStatus, string> = {
  PLANNING: "تخطيط",
  PENDING_ACTIVATION: "بانتظار تفعيل الدفعة المقدمة",
  ACTIVE: "نشط",
  ON_HOLD: "معلق",
  AWAITING_REVIEW: "بانتظار المراجعة",
  NEEDS_REVISION: "مطلوب تعديلات",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
  REVISION = "REVISION",
}

export const TASK_STATUS_AR: Record<TaskStatus, string> = {
  TODO: "قيد الانتظار",
  IN_PROGRESS: "قيد التنفيذ",
  IN_REVIEW: "قيد المراجعة",
  DONE: "مكتمل",
  REVISION: "مراجعة",
};

export enum TaskPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export const TASK_PRIORITY_AR: Record<TaskPriority, string> = {
  LOW: "منخفض",
  NORMAL: "عادي",
  HIGH: "عالي",
  URGENT: "عاجل",
};

export enum TaskDepartment {
  DESIGN = "DESIGN",
  CONTENT = "CONTENT",
  DEVELOPMENT = "DEVELOPMENT",
  MARKETING = "MARKETING",
  PRODUCTION = "PRODUCTION",
}

export enum ProjectMemberRole {
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export enum FilePurpose {
  DELIVERABLE = "DELIVERABLE",
  REFERENCE = "REFERENCE",
  INTERNAL_DRAFT = "INTERNAL_DRAFT",
}

/**
 * Lifecycle of a billing/delivery period (one month of a retainer).
 * UPCOMING → ACTIVE (start date reached) → CLOSED (end date reached / PM closes early).
 * ACTIVE → SUSPENDED (overdue invoice) → ACTIVE/CLOSED (paid). Phase 3 drives suspend.
 */
export enum ProjectPeriodStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  SUSPENDED = "SUSPENDED",
}

export const PROJECT_PERIOD_STATUS_AR: Record<ProjectPeriodStatus, string> = {
  UPCOMING: "قادم",
  ACTIVE: "نشط",
  CLOSED: "مغلق",
  SUSPENDED: "معلق",
};

/**
 * Lifecycle of a client meeting scheduled for a delivery period.
 * SCHEDULED → DONE (meeting held) | CANCELLED (called off).
 * SCHEDULED → RESCHEDULED → SCHEDULED (new time picked) → …
 */
export enum MeetingStatus {
  SCHEDULED = "SCHEDULED",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
  RESCHEDULED = "RESCHEDULED",
}

export const MEETING_STATUS_AR: Record<MeetingStatus, string> = {
  SCHEDULED: "مجدول",
  DONE: "تم",
  CANCELLED: "ملغى",
  RESCHEDULED: "مؤجل",
};

/** Shape of a PM-defined period goal (stored as Json on ProjectPeriod.goals). */
export type PeriodGoalStatus = "done" | "in_progress" | "pending";

export interface PeriodGoal {
  title: string;
  description?: string;
  progress: number;
  status: PeriodGoalStatus;
}

export enum DelayAlertLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum MarketingStrategyStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  APPROVED = "APPROVED",
  REVISION_REQUESTED = "REVISION_REQUESTED",
  REJECTED = "REJECTED",
}

export const MARKETING_STRATEGY_STATUS_AR: Record<
  MarketingStrategyStatus,
  string
> = {
  DRAFT: "مسودة",
  SENT: "تم الإرسال",
  APPROVED: "تمت الموافقة",
  REVISION_REQUESTED: "مطلوب تعديل",
  REJECTED: "مرفوض",
};
