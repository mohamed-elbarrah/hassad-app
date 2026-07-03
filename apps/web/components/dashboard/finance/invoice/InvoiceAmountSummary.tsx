"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { cn } from "@/lib/utils";
import { getDaysRemaining } from "@/lib/format";

interface InvoiceAmountSummaryProps {
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  collectionRate: number;
  status: string;
  dueDate: string | Date;
}

export function InvoiceAmountSummary({
  amount,
  paidAmount,
  remainingAmount,
  collectionRate,
  status,
  dueDate,
}: InvoiceAmountSummaryProps) {
  const isPaid = status === "PAID";
  const isLate = status === "LATE";
  const isOverdue = !isPaid && status !== "CANCELLED" && getDaysRemaining(dueDate) < 0;

  return (
    <div>
      <h3 className="text-base font-medium text-natural-100 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-portal-icon" />
        تفاصيل المبالغ
      </h3>

      <div className="space-y-4">
        {/* Status banners */}
        {isLate && (
          <div className="rounded-xl bg-gradient-to-l from-danger-500 to-danger-600 p-3.5 text-white flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">فاتورة متأخرة</p>
              <p className="text-xs opacity-90">يرجى متابعة العميل لتحصيل المبلغ المستحق.</p>
            </div>
          </div>
        )}

        {isOverdue && !isLate && (
          <div className="rounded-xl bg-gradient-to-l from-alert-500 to-alert-600 p-3.5 text-white flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">تجاوزت تاريخ الاستحقاق</p>
              <p className="text-xs opacity-90">يرجى تحديث الحالة أو متابعة التحصيل.</p>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="rounded-xl bg-gradient-to-l from-success-500 to-success-600 p-3.5 text-white flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">تم الدفع بالكامل</p>
              <p className="text-xs opacity-90">تم تحصيل كامل قيمة هذه الفاتورة.</p>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-portal-note-text">نسبة التحصيل</span>
            <span className="font-bold">{collectionRate}%</span>
          </div>
          <ProgressBar
            value={collectionRate}
            size="sm"
            variant={isPaid ? "success" : isLate ? "danger" : "default"}
          />
        </div>

        {/* Amount cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-badge-gray-bg">
            <p className="text-[10px] text-portal-note-text mb-0.5">الإجمالي</p>
            <p className="text-base font-bold text-natural-100">
              <CurrencyDisplay amount={amount} />
            </p>
          </div>
          <div className={cn("text-center p-3 rounded-xl", isPaid ? "bg-success-100/50" : "bg-badge-gray-bg")}>
            <p className={cn("text-[10px] mb-0.5", isPaid ? "text-success-600" : "text-portal-note-text")}>
              المدفوع
            </p>
            <p className={cn("text-base font-bold", isPaid ? "text-success-600" : "text-natural-100")}>
              <CurrencyDisplay amount={paidAmount} />
            </p>
          </div>
          <div className={cn("text-center p-3 rounded-xl", (isLate || isOverdue) && remainingAmount > 0 ? "bg-danger-100/50" : "bg-badge-gray-bg")}>
            <p className={cn("text-[10px] mb-0.5", (isLate || isOverdue) && remainingAmount > 0 ? "text-danger-600" : "text-portal-note-text")}>
              المتبقي
            </p>
            <p className={cn("text-base font-bold", (isLate || isOverdue) && remainingAmount > 0 ? "text-danger-600" : "text-natural-100")}>
              <CurrencyDisplay amount={remainingAmount} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
