/**
 * Dispute Ticket System Enums
 */

/**
 * Lifecycle status of a dispute ticket.
 * 
 * PENDING_APPROVAL → Admin reviews
 * REJECTED → Admin rejects (terminal)
 * APPROVED → Admin approves, PM notified
 * IN_PROGRESS → PM is working on resolution
 * PENDING_CLIENT → PM marked resolved, awaiting client confirmation
 * ESCALATED → Client says unresolved OR auto-escalated after deadline
 * RESOLVED → Successfully resolved
 * CLOSED → Admin closed (various reasons)
 */
export enum DisputeStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  REJECTED = "REJECTED",
  APPROVED = "APPROVED",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING_CLIENT = "PENDING_CLIENT",
  ESCALATED = "ESCALATED",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export const DISPUTE_STATUS_AR: Record<DisputeStatus, string> = {
  PENDING_APPROVAL: "بانتظار الموافقة",
  REJECTED: "مرفوض",
  APPROVED: "تمت الموافقة",
  IN_PROGRESS: "قيد المعالجة",
  PENDING_CLIENT: "بانتظار تأكيد العميل",
  ESCALATED: "تم التصعيد",
  RESOLVED: "تم الحل",
  CLOSED: "مغلق",
};

/**
 * Category of the dispute - what aspect the client is unhappy about.
 */
export enum DisputeCategory {
  DELAY = "DELAY", // Project delays
  QUALITY = "QUALITY", // Deliverable quality issues
  COMMUNICATION = "COMMUNICATION", // PM not responding, unprofessional
  BUDGET = "BUDGET", // Budget disputes
  SCOPE = "SCOPE", // Scope creep / feature disagreements
  ATTITUDE = "ATTITUDE", // Unprofessional behavior
  OTHER = "OTHER", // Catch-all
}

export const DISPUTE_CATEGORY_AR: Record<DisputeCategory, string> = {
  DELAY: "تأخير",
  QUALITY: "جودة",
  COMMUNICATION: "تواصل",
  BUDGET: "ميزانية",
  SCOPE: "نطاق العمل",
  ATTITUDE: "تعامل",
  OTHER: "أخرى",
};

/**
 * Priority level assigned by admin during approval.
 */
export enum DisputePriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export const DISPUTE_PRIORITY_AR: Record<DisputePriority, string> = {
  LOW: "منخفض",
  NORMAL: "عادي",
  HIGH: "عالي",
  URGENT: "عاجل",
};