"use client";

import { useState } from "react";
import { usePreviewPayrollQuery } from "@/features/finance/financeApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { X, Wallet, DollarSign, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  month: number;
  year: number;
  open: boolean;
  onClose: () => void;
  onPayAll: () => void;
  isPaying: boolean;
}

const MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export function PayrollPreviewModal({ month, year, open, onClose, onPayAll, isPaying }: Props) {
  const { data, isLoading } = usePreviewPayrollQuery(
    { month, year },
    { skip: !open },
  );

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-natural-0 rounded-3xl border border-portal-card-border shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto">
          <div className="px-6 py-5 border-b border-portal-divider flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">معاينة مسير الرواتب</h2>
              <p className="text-sm text-neutral-400">{MONTHS[month - 1]} {year}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <>
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-secondary-50/50 text-center">
                  <DollarSign className="w-5 h-5 text-secondary-600 mx-auto mb-1" />
                  <p className="text-xs text-neutral-400">إجمالي التكلفة</p>
                  <p className="text-xl font-bold"><CurrencyDisplay amount={data?.totalCost} size="sm" /></p>
                </div>
                <div className="p-4 rounded-xl bg-warning-50/50 text-center">
                  <Clock className="w-5 h-5 text-warning-600 mx-auto mb-1" />
                  <p className="text-xs text-neutral-400">معلقة للصرف</p>
                  <p className="text-xl font-bold text-warning-600">{data?.pendingCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 text-center">
                  <Users className="w-5 h-5 text-neutral-500 mx-auto mb-1" />
                  <p className="text-xs text-neutral-400">لم يتم التوليد</p>
                  <p className="text-xl font-bold">{data?.notGenerated}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="space-y-2">
                  {data?.employees.map((emp) => (
                    <div
                      key={emp.employeeId}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border",
                        emp.status === "PAID"
                          ? "border-success-200 bg-success-50/30"
                          : emp.status === "PENDING"
                            ? "border-warning-200 bg-warning-50/30"
                            : "border-portal-card-border bg-neutral-50/50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-xs font-bold text-secondary-600">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{emp.name}</p>
                          <p className="text-xs text-neutral-400">
                            {emp.payType === "HYBRID"
                              ? "ثابت + عمولة"
                              : emp.payType === "COMMISSION"
                                ? "عمولة"
                                : emp.payType === "HOURLY"
                                  ? "بالساعة"
                                  : "ثابت"}
                            {emp.commissionRate && ` (${Math.round(emp.commissionRate * 100)}%)`}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold"><CurrencyDisplay amount={emp.amount} size="sm" /></p>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-medium",
                            emp.status === "PAID" && "bg-success-100 text-success-600",
                            emp.status === "PENDING" && "bg-warning-100 text-warning-600",
                            emp.status === "NOT_GENERATED" && "bg-neutral-100 text-neutral-500",
                          )}
                        >
                          {emp.status === "PAID"
                            ? "تم الصرف"
                            : emp.status === "PENDING"
                              ? "معلق"
                              : "لم يتم التوليد"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-portal-divider flex justify-between items-center">
                <p className="text-sm text-neutral-400">
                  {data?.pendingCount > 0
                    ? `${data.pendingCount} موظف معلق للصرف`
                    : "لا يوجد رواتب معلقة"}
                </p>
                <ActionButton
                  variant="primary"
                  icon={<Wallet className="w-4 h-4" />}
                  onClick={onPayAll}
                  disabled={isPaying || (data?.pendingCount || 0) === 0}
                >
                  {isPaying ? "جاري الصرف..." : "صرف الجماعي"}
                </ActionButton>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
