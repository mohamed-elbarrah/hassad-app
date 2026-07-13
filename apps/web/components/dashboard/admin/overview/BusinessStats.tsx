"use client";

import { Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import type { PillTone } from "@/components/design-system/Pill";
import { cn } from "@/lib/utils";

export interface BusinessMetric {
  key: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: PillTone;
  tooltip?: string;
}

interface BusinessStatsProps {
  metrics: BusinessMetric[];
  className?: string;
}

const toneClasses: Record<PillTone, string> = {
  success: "text-success-600 bg-success-100/30",
  warning: "text-alert-600 bg-alert-100/30",
  danger: "text-danger-600 bg-danger-100/30",
  neutral: "text-portal-note-text bg-badge-gray-bg",
  purple: "text-action-purple bg-action-purple-soft",
  blue: "text-action-blue bg-action-blue-soft",
};

const iconBg: Record<PillTone, string> = {
  success: "bg-success-100/50",
  warning: "bg-alert-100/50",
  danger: "bg-danger-100/50",
  neutral: "bg-badge-gray-bg",
  purple: "bg-action-purple-soft",
  blue: "bg-action-blue-soft",
};

export function BusinessStats({ metrics, className }: BusinessStatsProps) {
  if (metrics.length === 0) return null;

  return (
    <SurfaceCard title="إحصائيات الأعمال" icon={Activity} className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div
            key={m.key}
            className="flex flex-col items-center gap-2 rounded-2xl border border-portal-card-border p-4 text-center"
            title={m.tooltip}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                iconBg[m.tone ?? "neutral"],
              )}
            >
              <m.icon
                className={cn(
                  "h-5 w-5",
                  m.tone ? toneClasses[m.tone].split(" ")[0] : "text-secondary-500",
                )}
              />
            </div>
            <span className="text-xs text-portal-note-text">{m.label}</span>
            <span className="text-lg font-semibold text-natural-100">
              {m.value}
            </span>
            {m.tone && (
              <Pill tone={m.tone}>{m.tone === "success" ? "جيد" : m.tone === "warning" ? "انتباه" : m.tone === "danger" ? "متراجع" : "—"}</Pill>
            )}
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
