"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { ReportPlatformDistribution } from "@/features/portal/portalApi";
import { formatCompactNumber } from "@/lib/format";

const PLATFORM_COLORS: Record<string, string> = {
  جوجل: "var(--color-primary-500)",
  ميتا: "var(--color-brand)",
  تيكتوك: "var(--color-success-500)",
  "سناب شات": "#6366f1",
};

const FALLBACK_COLORS = ["var(--color-brand)", "var(--color-primary-500)", "var(--color-success-500)", "#6366f1", "#F43F5E"];

interface SpendDistributionDonutChartProps {
  data: ReportPlatformDistribution[];
}

const fmtSpend = formatCompactNumber;

export function SpendDistributionDonutChart({
  data,
}: SpendDistributionDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-10 text-center">
        لا توجد بيانات كافية للمخطط.
      </p>
    );
  }

  const totalSpend = data.reduce((sum, d) => sum + d.spend, 0);

  return (
    <div className="flex flex-col items-center h-full">
      <div className="relative flex-1 w-full min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              dataKey="spend"
              nameKey="platform"
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.platform}
                  fill={
                    PLATFORM_COLORS[entry.platform] ||
                    FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `﷼${fmtSpend(value)}`,
                name,
              ]}
              contentStyle={{
                direction: "rtl",
                textAlign: "right",
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--color-border-default)",
                backgroundColor: "#fff",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xl font-bold" style={{ color: "var(--color-brand)" }}>
            ﷼{fmtSpend(totalSpend)}
          </p>
          <p className="text-xs text-muted-foreground">إجمالي الإنفاق</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-2">
        {data.map((d, i) => {
          const color =
            PLATFORM_COLORS[d.platform] ||
            FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          return (
            <div key={d.platform} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">
                {d.platform} ({Math.round(d.percent)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
