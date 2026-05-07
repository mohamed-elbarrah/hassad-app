"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ReportTimeline } from "@/features/portal/portalApi";

const METRIC_LABELS: Record<string, string> = {
  impressions: "الظهور",
  clicks: "النقرات",
  conversions: "التحويلات",
  spend: "الإنفاق",
};

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("ar-SA-u-nu-latn");
}

export type BarGranularity = "week" | "month";

const GRANULARITY_OPTIONS: { key: BarGranularity; label: string }[] = [
  { key: "week", label: "أسبوعياً" },
  { key: "month", label: "شهرياً" },
];

interface MonthlyComparisonBarChartProps {
  timeline: ReportTimeline | undefined;
  granularity: BarGranularity;
  onGranularityChange: (g: BarGranularity) => void;
  selectedMetric?: string;
}

export function MonthlyComparisonBarChart({
  timeline,
  granularity,
  onGranularityChange,
  selectedMetric,
}: MonthlyComparisonBarChartProps) {
  const [open, setOpen] = useState(false);

  if (!timeline || timeline.labels.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-10 text-center">
        لا توجد بيانات كافية للمخطط.
      </p>
    );
  }

  const chartData = timeline.labels.map((label, i) => {
    const point: Record<string, number | string> = { name: label };
    for (const ds of timeline.datasets) {
      point[ds.metric] = ds.data[i] ?? 0;
    }
    return point;
  });

  const visibleDataset = selectedMetric
    ? timeline.datasets.find((ds) => ds.metric === selectedMetric)
    : timeline.datasets[0];

  const dataKey = visibleDataset?.metric || timeline.datasets[0]?.metric || "impressions";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-gray-50 rounded-lg px-3 py-1.5 border"
          >
            {GRANULARITY_OPTIONS.find((g) => g.key === granularity)?.label}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[100px]">
              {GRANULARITY_OPTIONS.map((g) => (
                <button
                  key={g.key}
                  className="block w-full text-right px-3 py-1.5 text-xs hover:bg-gray-50"
                  onClick={() => {
                    onGranularityChange(g.key);
                    setOpen(false);
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              reversed
            />
            <YAxis
              tickFormatter={fmtCompact}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              orientation="right"
            />
            <Tooltip
              formatter={(value: number) => [
                fmtCompact(value),
                METRIC_LABELS[dataKey] || dataKey,
              ]}
              contentStyle={{
                direction: "rtl",
                textAlign: "right",
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                backgroundColor: "#fff",
              }}
              cursor={{ fill: "rgba(18,25,54,0.04)" }}
            />
            <Bar
              dataKey={dataKey}
              fill="#121936"
              radius={[4, 4, 0, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}