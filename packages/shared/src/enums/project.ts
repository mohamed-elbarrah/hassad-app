export enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  AWAITING_REVIEW = "AWAITING_REVIEW",
  NEEDS_REVISION = "NEEDS_REVISION",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export const PROJECT_STATUS_AR: Record<ProjectStatus, string> = {
  PLANNING: "تخطيط",
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

export const MARKETING_STRATEGY_STATUS_AR: Record<MarketingStrategyStatus, string> = {
  DRAFT: "مسودة",
  SENT: "تم الإرسال",
  APPROVED: "تمت الموافقة",
  REVISION_REQUESTED: "مطلوب تعديل",
  REJECTED: "مرفوض",
};
