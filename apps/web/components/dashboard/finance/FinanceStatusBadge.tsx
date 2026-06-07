"use client";

import { StatusBadge } from "@/components/design-system/StatusBadge";

type FinanceStatus =
  | "PAID"
  | "PARTIAL"
  | "PENDING"
  | "FAILED"
  | "UNPAID"
  | "SUCCESS"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

interface FinanceStatusBadgeProps {
  status: FinanceStatus | string;
  className?: string;
}

const financeToDsMap: Record<string, { status: string; label: string }> = {
  PAID: { status: "PAID", label: "مدفوع" },
  SUCCESS: { status: "PAID", label: "ناجح" },
  PARTIAL: { status: "PENDING", label: "مدفوع جزئياً" },
  PENDING: { status: "PENDING", label: "قيد الانتظار" },
  DUE: { status: "PENDING", label: "مستحق" },
  SENT: { status: "SENT", label: "تم الإرسال" },
  LATE: { status: "OVERDUE", label: "متأخر" },
  FAILED: { status: "CANCELLED", label: "فاشل" },
  CANCELLED: { status: "CANCELLED", label: "ملغي" },
  UNPAID: { status: "DRAFT", label: "غير مدفوع" },
  HIGH: { status: "OVERDUE", label: "مرتفع" },
  MEDIUM: { status: "PENDING", label: "متوسط" },
  LOW: { status: "ACTIVE", label: "منخفض" },
};

export function FinanceStatusBadge({
  status,
  className,
}: FinanceStatusBadgeProps) {
  const mapped = financeToDsMap[status];

  return (
    <StatusBadge
      status={mapped?.status ?? status}
      label={mapped?.label ?? status}
      className={className}
    />
  );
}
