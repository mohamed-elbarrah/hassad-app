"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FinanceStatus = "PAID" | "PARTIAL" | "PENDING" | "FAILED" | "UNPAID" | "SUCCESS" | "HIGH" | "MEDIUM" | "LOW";

interface FinanceStatusBadgeProps {
  status: FinanceStatus | string;
  className?: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  PAID: { label: "مدفوع", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200" },
  SUCCESS: { label: "ناجح", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200" },
  PARTIAL: { label: "مدفوع جزئياً", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200" },
  PENDING: { label: "قيد الانتظار", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200" },
  DUE: { label: "مستحق", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200" },
  SENT: { label: "تم الإرسال", className: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100" },
  LATE: { label: "متأخر", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200" },
  FAILED: { label: "فاشل", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200" },
  CANCELLED: { label: "ملغي", className: "bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-500 border-slate-200" },
  UNPAID: { label: "غير مدفوع", className: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border-slate-200" },
  HIGH: { label: "مرتفع", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200" },
  MEDIUM: { label: "متوسط", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200" },
  LOW: { label: "منخفض", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200" },
};

export function FinanceStatusBadge({ status, className }: FinanceStatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: "bg-slate-100 text-slate-700" };
  
  return (
    <Badge variant="outline" className={cn("font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap", config.className, className)}>
      {config.label}
    </Badge>
  );
}
