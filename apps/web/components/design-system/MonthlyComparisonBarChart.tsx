"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ReportTimeline } from "@/features/portal/portalApi";
import { formatCompactNumber } from "@/lib/format";

const METRIC_LABELS: Record<string, string> = {
  impressions: "الظهور",
  clicks: "النقرات",
  conversions: "التحويلات",
  spend: "الإنفاق",
};

const fmtCompact = formatCompactNumber;

interface MonthlyComparisonBarChartProps {
  timeline: ReportTimeline | undefined;
  selectedMetric?: string;
}

export function MonthlyComparisonBarChart({
  timeline,
  selectedMetric,
}: MonthlyComparisonBarChartProps) {
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

  const dataKey =
    visibleDataset?.metric || timeline.datasets[0]?.metric || "impressions";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--color-text-subtle)" }}
          axisLine={false}
          tickLine={false}
          reversed
        />
        <YAxis
          tickFormatter={fmtCompact}
          tick={{ fontSize: 11, fill: "var(--color-text-subtle)" }}
          axisLine={false}
          tickLine={false}
          orientation="right"
          width={50}
          tickMargin={30}
        />
        <Tooltip
          formatter={(value: number) => [
            fmtCompact(value),
            METRIC_LABELS[dataKey] || dataKey,
          ]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid var(--color-border-default)",
            backgroundColor: "#fff",
          }}
          cursor={{ fill: "rgba(18,25,54,0.04)" }}
        />
        <Bar dataKey={dataKey} fill="var(--color-brand)" barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
