"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { MiniPeriodFilter, periodToDateRange } from "./MiniPeriodFilter";
import type { PeriodKey } from "./MiniPeriodFilter";
import { cn } from "@/lib/utils";
import { formatCompactNumber, formatCurrency } from "@/lib/format";

export interface TrendMetricOption {
  key: string;
  label: string;
  data: number[];
  color: string;
  format?: "number" | "currency";
}

interface TrendChartProps {
  labels: string[];
  metrics: TrendMetricOption[];
  period?: PeriodKey;
  onPeriodChange?: (key: PeriodKey) => void;
  className?: string;
}

function computePercentChange(data: number[]): number | null {
  if (data.length < 14) return null;
  const recent = data.slice(0, 7).reduce((a, b) => a + b, 0);
  const previous = data.slice(7, 14).reduce((a, b) => a + b, 0);
  if (previous === 0) return recent > 0 ? 100 : null;
  return Math.round(((recent - previous) / previous) * 100);
}

export function TrendChart({ labels, metrics, period, onPeriodChange, className }: TrendChartProps) {
  const [activeMetric, setActiveMetric] = useState(metrics[0]?.key ?? "");

  const currentMetric = metrics.find((m) => m.key === activeMetric) ?? metrics[0];
  const pctChange = currentMetric ? computePercentChange(currentMetric.data) : null;

  if (!labels || labels.length === 0 || metrics.length === 0) {
    return (
      <SurfaceCard title="اتجاهات الأداء" icon={TrendingUp} className={className}>
        <p className="text-xs text-portal-note-text text-center py-10">
          لا توجد بيانات كافية للمخطط.
        </p>
      </SurfaceCard>
    );
  }

  const chartData = labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    for (const m of metrics) {
      point[m.key] = m.data[i] ?? 0;
    }
    return point;
  });

  return (
    <SurfaceCard
      title="اتجاهات الأداء"
      icon={TrendingUp}
      action={
        <div className="flex items-center gap-2">
          {period && onPeriodChange ? (
            <MiniPeriodFilter value={period} onChange={onPeriodChange} />
          ) : null}
          <a
            href="/dashboard/admin/reports"
            className="text-xs text-secondary-500 hover:text-secondary-600"
          >
            عرض التقرير الكامل ←
          </a>
        </div>
      }
      className={className}
    >
      <div className="flex items-center gap-2 mb-4">
        {metrics.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setActiveMetric(m.key)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
              activeMetric === m.key
                ? "bg-natural-100 text-white"
                : "text-portal-note-text hover:text-natural-100",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              reversed
            />
            <YAxis
              tickFormatter={(v: number) => formatCompactNumber(v)}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              orientation="right"
              width={50}
              tickMargin={30}
            />
            <Tooltip
              formatter={(value: number) => {
                if (currentMetric?.format === "currency") {
                  return [formatCurrency(value), currentMetric.label];
                }
                return [formatCompactNumber(value), currentMetric.label];
              }}
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
              dataKey={currentMetric?.key ?? ""}
              stroke={currentMetric?.color ?? "#121936"}
              strokeWidth={2}
              fill={currentMetric?.color ?? "#121936"}
              fillOpacity={0.06}
              dot={false}
              activeDot={{ r: 4, fill: currentMetric?.color, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {pctChange !== null && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "font-medium",
              pctChange > 0
                ? "text-success-600"
                : pctChange < 0
                  ? "text-danger-600"
                  : "text-neutral-300",
            )}
          >
            {pctChange > 0 ? "↑" : pctChange < 0 ? "↓" : "→"}{" "}
            {Math.abs(pctChange)}%
          </span>
          <span className="text-portal-note-text">
            عن الشهر الماضي
          </span>
        </div>
      )}
    </SurfaceCard>
  );
}
