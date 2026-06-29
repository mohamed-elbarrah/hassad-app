"use client";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  // Finance statuses
  PAID: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "مدفوع",
  },
  UNPAID: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "غير مدفوع",
  },
  PARTIAL: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "مدفوع جزئياً",
  },
  DUE: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "مستحق",
  },
  LATE: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "متأخر",
  },
  
  // Blue/Purple statuses - "Under Review" states (distinct from gray)
  AWAITING_REVIEW: {
    bg: "bg-action-blue-soft",
    text: "text-action-blue",
    border: "border-action-blue-soft",
    label: "بانتظار المراجعة",
  },
  IN_REVIEW: {
    bg: "bg-action-purple-soft",
    text: "text-action-purple",
    border: "border-action-purple-soft",
    label: "قيد المراجعة",
  },
  SENT: {
    bg: "bg-action-blue-soft",
    text: "text-action-blue",
    border: "border-action-blue-soft",
    label: "مرسل",
  },
  
  // Orange/Yellow - "Warning/Attention" states
  PENDING: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "معلق",
  },
  ON_HOLD: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "معلق",
  },
  NEEDS_REVISION: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "مطلوب تعديلات",
  },
  REVISION: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "تعديل مطلوب",
  },
  PAUSED: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "متوقف مؤقتاً",
  },
  
  // Green - "Success/Active" states
  ACTIVE: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "نشط",
  },
  COMPLETED: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "مكتمل",
  },
  DONE: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "مكتمل",
  },
  SIGNED: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "موقع",
  },
  APPROVED: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "معتمد",
  },
  IN_PROGRESS: {
    bg: "bg-primary-100",
    text: "text-primary-600",
    border: "border-primary-200",
    label: "قيد التنفيذ",
  },
  
  // Red - "Danger/Error" states
  CANCELLED: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "ملغي",
  },
  REJECTED: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "مرفوض",
  },
  REJECT: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "مرفوض",
  },
  EXPIRED: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "منتهي",
  },
  OVERDUE: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "متأخر",
  },
  STOPPED: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "متوقف",
  },
  
  // Gray - "Neutral/Info" states
  PLANNING: {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    label: "تخطيط",
  },
  TODO: {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    label: "لم يبدأ",
  },
  DRAFT: {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    label: "مسودة",
  },
  NEW: {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    label: "جديد",
  },
  
  // Proposal statuses - Additional uppercase
  REVISION_REQUESTED: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200",
    label: "مطلوب مراجعة",
  },
  SCHEDULED: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200",
    label: "مجدول",
  },
  RESCHEDULED: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "مؤجل",
  },
  
  // Lowercase - Blue/Purple (Review states)
  "awaiting-review": {
    bg: "bg-action-blue-soft",
    text: "text-action-blue",
    border: "border-action-blue-soft",
    label: "بانتظار المراجعة",
  },
  "in-review": {
    bg: "bg-action-purple-soft",
    text: "text-action-purple",
    border: "border-action-purple-soft",
    label: "قيد المراجعة",
  },
  sent: {
    bg: "bg-action-blue-soft",
    text: "text-action-blue",
    border: "border-action-blue-soft",
    label: "مرسل",
  },
  awaiting: {
    bg: "bg-action-blue-soft",
    text: "text-action-blue",
    border: "border-action-blue-soft",
    label: "بانتظار المراجعة",
  },
  inreview: {
    bg: "bg-action-purple-soft",
    text: "text-action-purple",
    border: "border-action-purple-soft",
    label: "قيد المراجعة",
  },
  
  // Lowercase - Orange (Warning/Attention states)
  "needs-revision": {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200",
    label: "مطلوب تعديلات",
  },
  needsrevision: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200",
    label: "مطلوب تعديلات",
  },
  revision: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200",
    label: "تعديل مطلوب",
  },
  "on-hold": {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "معلق",
  },
  pending: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "معلق",
  },
  partial: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "مدفوع جزئياً",
  },
  due: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "مستحق",
  },
  hold: {
    bg: "bg-alert-100",
    text: "text-alert-600",
    border: "border-alert-200",
    label: "معلق",
  },
  
  // Lowercase - Green (Success states)
  completed: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "مكتمل",
  },
  active: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "نشط",
  },
  done: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "مكتمل",
  },
  signed: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "موقع",
  },
  approved: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "معتمد",
  },
  paid: {
    bg: "bg-success-100",
    text: "text-success-600",
    border: "border-success-200",
    label: "مدفوع",
  },
  "in-progress": {
    bg: "bg-primary-100",
    text: "text-primary-600",
    border: "border-primary-200",
    label: "قيد التنفيذ",
  },
  progress: {
    bg: "bg-primary-100",
    text: "text-primary-600",
    border: "border-primary-200",
    label: "قيد التنفيذ",
  },
  
  // Lowercase - Red (Danger/Error states)
  cancelled: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "ملغي",
  },
  rejected: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "مرفوض",
  },
  expired: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "منتهي",
  },
  overdue: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "متأخر",
  },
  stopped: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "متوقف",
  },
  late: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "متأخر",
  },
  unpaid: {
    bg: "bg-danger-100",
    text: "text-danger-600",
    border: "border-danger-200",
    label: "غير مدفوع",
  },
  
  // Lowercase - Gray (Neutral states)
  planning: {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    label: "تخطيط",
  },
  "not-started": {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    label: "لم يبدأ",
  },
  todo: {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    label: "لم يبدأ",
  },
  draft: {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    label: "مسودة",
  },
  new: {
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    border: "border-neutral-200",
    label: "جديد",
  },
};

export type StatusType = string;

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  // Debug: Log unknown statuses in development
  if (process.env.NODE_ENV === 'development' && !STATUS_MAP[status]) {
    console.warn(`[StatusBadge] Unknown status: "${status}"`);
  }
  
  const style = STATUS_MAP[status] ?? STATUS_MAP.DRAFT;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        style.border,
        className,
      )}
    >
      {label ?? style.label}
    </span>
  );
}
