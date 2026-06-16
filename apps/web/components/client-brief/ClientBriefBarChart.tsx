"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/format";

interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

interface ClientBriefBarChartProps {
  data: Record<string, string | number>[];
  series: ChartSeries[];
  valueType?: "currency" | "number";
  showLegend?: boolean;
}

export function ClientBriefBarChart({
  data,
  series,
  valueType = "number",
  showLegend = true,
}: ClientBriefBarChartProps) {
  const formatValue = (value: number) => {
    if (valueType === "currency") return formatCurrency(value);
    return formatNumber(value) ?? String(value);
  };

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          barGap={8}
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6F7485" }}
            axisLine={false}
            tickLine={false}
            reversed
          />
          <YAxis
            tickFormatter={(value: number) =>
              valueType === "currency"
                ? `${Math.round(value / 1000)}K`
                : (formatNumber(value) ?? String(value))
            }
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            orientation="right"
            width={40}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatValue(value),
              name,
            ]}
            contentStyle={{
              direction: "rtl",
              textAlign: "right",
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #E1E4EA",
              backgroundColor: "#fff",
            }}
            cursor={{ fill: "rgba(18,25,54,0.04)" }}
          />
          {showLegend && (
            <Legend
              verticalAlign="top"
              align="left"
              iconType="circle"
              wrapperStyle={{
                paddingBottom: 16,
                fontSize: 12,
                color: "#6F7485",
              }}
            />
          )}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={[6, 6, 0, 0]}
              barSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
