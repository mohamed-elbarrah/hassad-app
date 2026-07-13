"use client";

import { FileText } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

export interface ConversionStep {
  label: string;
  from: number;
  to: number;
  rate: number;
  color: string;
}

interface ContractChartProps {
  steps: ConversionStep[];
  className?: string;
}

export function ContractChart({ steps, className }: ContractChartProps) {
  if (steps.length === 0 || steps.every((s) => s.from === 0)) {
    return (
      <SurfaceCard title="تحويل العقود" icon={FileText} className={className}>
        <p className="text-xs text-portal-note-text text-center py-10">
          لا توجد بيانات كافية.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      title="تحويل العقود"
      icon={FileText}
      action={
        <a
          href="/dashboard/admin/contracts"
          className="text-xs text-secondary-500 hover:text-secondary-600"
        >
          عرض كل العقود ←
        </a>
      }
      className={className}
    >
      <div className="space-y-5">
        {steps.map((step) => {
          const maxVal = Math.max(step.from, step.to, 1);
          const fromPct = Math.round((step.from / maxVal) * 100);
          const toPct = Math.round((step.to / maxVal) * 100);

          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-natural-100">
                  {step.label}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    step.rate > 70
                      ? "text-success-600"
                      : step.rate > 40
                        ? "text-alert-600"
                        : "text-danger-600",
                  )}
                >
                  {step.from > 0 ? `${step.rate}%` : "—"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs text-portal-note-text">
                    <span>من</span>
                    <span>{formatNumber(step.from)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-badge-gray-bg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-neutral-300"
                      style={{ width: `${fromPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs text-portal-note-text">
                    <span>إلى</span>
                    <span>{formatNumber(step.to)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-badge-gray-bg overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${toPct}%`, backgroundColor: step.color }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
