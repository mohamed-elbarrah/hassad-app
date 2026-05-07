"use client";

import {
  AreaChart,
  Area,
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

interface PerformanceTrendLineChartProps {
  timeline: ReportTimeline | undefined;
  selectedMetric?: string;
}

export function PerformanceTrendLineChart({
  timeline,
  selectedMetric,
}: PerformanceTrendLineChartProps) {
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
  const color = "#121936";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
          orientation="left"
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
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.06}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}