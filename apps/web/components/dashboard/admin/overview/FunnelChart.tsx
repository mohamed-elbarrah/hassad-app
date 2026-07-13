"use client";

import { BarChart3 } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { formatNumber } from "@/lib/format";

export interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  conversionRate: number;
  className?: string;
}

export function FunnelChart({ stages, conversionRate, className }: FunnelChartProps) {
  if (stages.length === 0 || stages.every((s) => s.value === 0)) {
    return (
      <SurfaceCard title="مسار التحويل" icon={BarChart3} className={className}>
        <p className="text-xs text-portal-note-text text-center py-10">
          لا توجد بيانات للمسار التحويلي.
        </p>
      </SurfaceCard>
    );
  }

  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <SurfaceCard
      title="مسار التحويل"
      icon={BarChart3}
      action={
        <a
          href="/dashboard/admin/reports"
          className="text-xs text-secondary-500 hover:text-secondary-600"
        >
          عرض مسار التحويل الكامل ←
        </a>
      }
      className={className}
    >
      <div className="space-y-4">
        {stages.map((stage) => {
          const pct = Math.round((stage.value / maxValue) * 100);
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-natural-100">{stage.label}</span>
                <span className="text-sm font-semibold text-natural-100">
                  {formatNumber(stage.value)}
                </span>
              </div>
              <div className="h-3 rounded-full bg-badge-gray-bg overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: stage.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-portal-divider flex items-center justify-between">
        <span className="text-sm text-portal-note-text">نسبة التحويل</span>
        <Pill tone={conversionRate > 30 ? "success" : conversionRate > 15 ? "warning" : "danger"}>
          {conversionRate}%
        </Pill>
      </div>
    </SurfaceCard>
  );
}
