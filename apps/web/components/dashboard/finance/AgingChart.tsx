"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AlertTriangle } from "lucide-react";

interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

interface Props {
  data: AgingBucket[];
  isLoading?: boolean;
}

export function AgingChart({ data, isLoading }: Props) {
  const total = useMemo(() => data.reduce((s, d) => s + d.amount, 0), [data]);
  const max = useMemo(() => Math.max(...data.map((d) => d.amount), 1), [data]);

  if (isLoading) {
    return (
      <SurfaceCard className="border-none shadow-md h-full" title="تقسيم المبالغ المستحقة">
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-neutral-100 rounded-lg" />
          ))}
        </div>
      </SurfaceCard>
    );
  }

  const colors = ["bg-success-500", "bg-alert-500", "bg-orange-500", "bg-danger-500"];

  return (
    <SurfaceCard
      className="border-none shadow-md h-full"
      title="تقسيم المبالغ المستحقة"
      description="توزيع الفواتير غير المدفوعة حسب مدة التأخير"
      icon={AlertTriangle}
    >
      <div className="space-y-4 pt-2">
        {data.map((bucket, idx) => {
          const pct = max > 0 ? (bucket.amount / max) * 100 : 0;
          const pctOfTotal = total > 0 ? (bucket.amount / total) * 100 : 0;
          return (
            <div key={bucket.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-natural-100">{bucket.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400 text-xs">{bucket.count} فاتورة</span>
                  <span className="font-bold text-natural-100">{formatCurrency(bucket.amount)}</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", colors[idx])}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-400 text-left">{pctOfTotal.toFixed(1)}% من الإجمالي</p>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="text-center py-8 text-neutral-400 text-sm">لا توجد فواتير مستحقة</div>
        )}
      </div>
    </SurfaceCard>
  );
}
