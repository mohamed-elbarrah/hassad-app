"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/design-system/EmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import { BarChart3 } from "lucide-react";

interface UsersBarChartProps {
  data: { label: string; users: number; clients: number }[];
  isLoading: boolean;
}

export function UsersBarChart({ data, isLoading }: UsersBarChartProps) {
  if (isLoading) {
    return <Skeleton className="h-full w-full rounded-2xl" />;
  }

  return (
    <div className="h-full" dir="ltr">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
          >
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
            />
            <YAxis
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6f7485", fontSize: 11 }}
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
                    {payload.map((p: any) => (
                      <div
                        key={p.dataKey}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: p.color }}
                          />
                          <span className="text-portal-note-text">
                            {p.dataKey === "users" ? "مستخدمون" : "عملاء"}
                          </span>
                        </span>
                        <span className="font-bold text-natural-100">
                          {p.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
              cursor={{ fill: "rgba(18, 25, 54, 0.03)" }}
            />
            <Bar
              dataKey="users"
              fill="#121936"
              radius={[6, 6, 0, 0]}
              barSize={16}
              animationDuration={700}
            />
            <Bar
              dataKey="clients"
              fill="#0ed589"
              radius={[6, 6, 0, 0]}
              barSize={16}
              animationDuration={900}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState icon={BarChart3} title="لا توجد بيانات" />
      )}
    </div>
  );
}
