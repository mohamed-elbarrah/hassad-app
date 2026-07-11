"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/design-system/EmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { TrendingUp } from "lucide-react";

interface RevenueChartProps {
  data: { label: string; value: number }[];
  isLoading: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return <Skeleton className="h-full w-full rounded-2xl" />;
  }

  return (
    <div className="h-full" dir="ltr">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e7be52" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#e7be52" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#ECEEF2"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6f7485", fontSize: 11 }}
              dy={8}
              minTickGap={24}
            />
            <YAxis
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6f7485", fontSize: 11 }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
              width={44}
            />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return (
                  <div
                    className="rounded-xl border border-portal-card-border bg-natural-0 shadow-lg px-3 py-2 min-w-[140px]"
                    dir="rtl"
                  >
                    <p className="text-[11px] text-portal-note-text mb-1">
                      {label}
                    </p>
                    <CurrencyDisplay amount={payload[0].value} size="sm" />
                  </div>
                );
              }}
              cursor={{ stroke: "#E1E4EA", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#e7be52"
              strokeWidth={3}
              fill="url(#revenueFill)"
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState icon={TrendingUp} title="لا توجد بيانات" />
      )}
    </div>
  );
}
