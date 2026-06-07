"use client";
import { cn } from "@/lib/utils";

const STATUS_MAP = {
  PAID:        { bg: "bg-success-100", text: "text-success-600", border: "border-success-200", label: "مدفوع" },
  COMPLETED:   { bg: "bg-success-100", text: "text-success-600", border: "border-success-200", label: "مكتمل" },
  ACTIVE:      { bg: "bg-success-100", text: "text-success-600", border: "border-success-200", label: "نشط" },
  PENDING:     { bg: "bg-alert-100",   text: "text-alert-600",   border: "border-alert-200",   label: "معلق" },
  IN_PROGRESS: { bg: "bg-alert-100",   text: "text-alert-600",   border: "border-alert-200",   label: "قيد التنفيذ" },
  OVERDUE:     { bg: "bg-danger-100",  text: "text-danger-600",  border: "border-danger-200",  label: "متأخر" },
  CANCELLED:   { bg: "bg-danger-100",  text: "text-danger-600",  border: "border-danger-200",  label: "ملغي" },
  STOPPED:     { bg: "bg-danger-100",  text: "text-danger-600",  border: "border-danger-200",  label: "متوقف" },
  DRAFT:       { bg: "bg-neutral-50",  text: "text-neutral-300", border: "border-neutral-200", label: "مسودة" },
  NEW:         { bg: "bg-neutral-50",  text: "text-neutral-300", border: "border-neutral-200", label: "جديد" },
  SIGNED:      { bg: "bg-success-100", text: "text-success-600", border: "border-success-200", label: "موقع" },
  SENT:        { bg: "bg-alert-100",   text: "text-alert-600",   border: "border-alert-200",   label: "مرسل" },
  APPROVED:    { bg: "bg-success-100", text: "text-success-600", border: "border-success-200", label: "معتمد" },
  REJECTED:    { bg: "bg-danger-100",  text: "text-danger-600",  border: "border-danger-200",  label: "مرفوض" },
  EXPIRED:     { bg: "bg-danger-100",  text: "text-danger-600",  border: "border-danger-200",  label: "منتهي" },
} as const;

export type StatusType = string;

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
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
