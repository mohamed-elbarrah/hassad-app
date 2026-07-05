"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { TrendingUp } from "lucide-react";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { useMemo } from "react";

interface TrendItem {
  label: string;
  income: number;
  invoiced: number;
}

interface Props {
  data: TrendItem[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const income = payload.find((p: any) => p.dataKey === "income")?.value ?? 0;
  const invoiced =
    payload.find((p: any) => p.dataKey === "invoiced")?.value ?? 0;

  return (
    <div className="rounded-lg border border-portal-card-border bg-natural-0 shadow-lg px-3 py-2 min-w-[160px]">
      <p className="text-[11px] text-portal-note-text text-center mb-1.5 border-b border-portal-divider pb-1">
        {label}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
            <span className="text-xs text-portal-note-text">المدفوعات</span>
          </div>
          <span className="text-xs font-bold text-natural-100">
            <CurrencyDisplay amount={income} size="sm" />
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#f43f5e]" />
            <span className="text-xs text-portal-note-text">الفواتير</span>
          </div>
          <span className="text-xs font-bold text-natural-100">
            <CurrencyDisplay amount={invoiced} size="sm" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function RevenueTrendChart({ data, isLoading }: Props) {
  const chartData = useMemo(() => [...data].reverse(), [data]);

  const tickInterval = useMemo(() => {
    const count = chartData.length;
    if (count <= 7) return 0;
    if (count <= 14) return 1;
    if (count <= 30) return 3;
    return Math.floor(count / 8);
  }, [chartData.length]);

  if (isLoading) {
    return (
      <SurfaceCard
        className="border-none shadow-md"
        title="الإيرادات مقابل الفواتير"
      >
        <div className="h-[340px] animate-pulse bg-badge-gray-bg rounded-xl" />
      </SurfaceCard>
    );
  }

  const hasData = chartData.length > 0;

  return (
    <SurfaceCard
      className="border-none shadow-md"
      title="الإيرادات مقابل الفواتير"
      description="مقارنة المدفوعات الواردة بالفواتير المصدرة"
      icon={TrendingUp}
    >
      <div className="flex items-center gap-5 mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-[2px] bg-[hsl(var(--primary))] rounded-full" />
          <span className="text-xs text-portal-note-text">المدفوعات</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-[2px] rounded-full"
            style={{
              background:
                "repeating-linear-gradient(90deg, #f43f5e, #f43f5e 4px, transparent 4px, transparent 7px)",
            }}
          />
          <span className="text-xs text-portal-note-text">
            الفواتير المصدرة
          </span>
        </div>
      </div>

      <div className="h-[300px]" dir="ltr">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 8, left: 16, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#F0F1F5"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#A8ABB2" }}
                dy={8}
                interval={tickInterval}
                minTickGap={24}
              />
              <YAxis
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#A8ABB2" }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
                width={48}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#E1E4EA", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "hsl(var(--primary))",
                  stroke: "#fff",
                  strokeWidth: 2.5,
                }}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
              <Line
                type="monotone"
                dataKey="invoiced"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#f43f5e",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-portal-note-text">
            <TrendingUp className="w-8 h-8 mb-2 text-portal-note-text" />
            <p className="text-sm">لا توجد بيانات لهذه الفترة</p>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
