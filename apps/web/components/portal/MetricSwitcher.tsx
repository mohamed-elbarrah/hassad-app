"use client";

import { Button } from "@/components/ui/button";

export type ChartMetric = "impressions" | "clicks" | "conversions" | "spend" | "all";

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
        <Button
          key={m.key}
          variant={value === m.key ? "default" : "outline"}
          size="sm"
          className="text-xs h-7 px-2.5"
          onClick={() => onChange(m.key)}
        >
          {m.label}
        </Button>
      ))}
    </div>
  );
}