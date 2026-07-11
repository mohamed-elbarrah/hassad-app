"use client";

import { Skeleton } from "@/components/design-system/Skeleton";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

interface FunnelCardProps {
  funnel?: {
    leads?: number;
    clients?: number;
    proposals?: number;
    contracts?: number;
    projects?: number;
    invoices?: number;
    payments?: number;
  };
  isLoading: boolean;
}

export function FunnelCard({ funnel, isLoading }: FunnelCardProps) {
  if (isLoading || !funnel) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-xl" />
        ))}
      </div>
    );
  }

  const stages = [
    { label: "عملاء محتملون", value: funnel.leads, color: "bg-secondary-500" },
    { label: "عملاء", value: funnel.clients, color: "bg-secondary-400" },
    { label: "عروض", value: funnel.proposals, color: "bg-action-purple" },
    { label: "عقود", value: funnel.contracts, color: "bg-action-purple" },
    { label: "مشاريع", value: funnel.projects, color: "bg-primary-500" },
    { label: "فواتير", value: funnel.invoices, color: "bg-primary-500" },
    { label: "مدفوعات", value: funnel.payments, color: "bg-success-500" },
  ];
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const width = (stage.value / max) * 100;
        const prev = idx > 0 ? stages[idx - 1].value : 0;
        const rate = prev > 0 ? Math.round((stage.value / prev) * 100) : 100;
        return (
          <div key={stage.label} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-natural-100 font-medium">
                {stage.label}
              </span>
              <div className="flex items-center gap-2">
                {idx > 0 && (
                  <span className="text-[11px] text-portal-note-text">
                    {rate}% تحويل
                  </span>
                )}
                <span className="font-bold text-natural-100">
                  {stage.value.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="h-8 rounded-2xl bg-badge-gray-bg overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-2xl flex items-center px-3 transition-all duration-700",
                  stage.color,
                )}
                style={{ width: `${Math.max(width, 4)}%` }}
              >
                {width > 12 && (
                  <span className="text-[11px] font-bold text-white/90 drop-shadow">
                    {width.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
