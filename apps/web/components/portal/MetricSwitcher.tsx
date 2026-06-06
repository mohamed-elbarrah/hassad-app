"use client";

import { PortalActionButton } from "./PortalActionButton";

export type ChartMetric =
  | "impressions"
  | "clicks"
  | "conversions"
  | "spend"
  | "all";

const METRICS: { key: ChartMetric; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "impressions", label: "الظهور" },
  { key: "clicks", label: "النقرات" },
  { key: "conversions", label: "التحويلات" },
  { key: "spend", label: "الإنفاق" },
];

interface MetricSwitcherProps {
  value: ChartMetric;
  onChange: (metric: ChartMetric) => void;
}

export function MetricSwitcher({ value, onChange }: MetricSwitcherProps) {
  return (
    <div className="flex gap-1 flex-wrap" dir="rtl">
      {METRICS.map((m) => (
        <PortalActionButton
          key={m.key}
          variant={value === m.key ? "toggle-active" : "toggle-inactive"}
          size="sm"
          onClick={() => onChange(m.key)}
        >
          {m.label}
        </PortalActionButton>
      ))}
    </div>
  );
}
