"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { EmptyState } from "@/components/design-system/EmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import { BarChart3 } from "lucide-react";

interface RoleDistributionProps {
  data: { name: string; value: number }[];
  total: number;
  isLoading: boolean;
}

export function RoleDistribution({
  data,
  total,
  isLoading,
}: RoleDistributionProps) {
  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  const colors = [
    "#121936",
    "#0ed589",
    "#7a13e8",
    "#2684fc",
    "#f8af01",
    "#00aeff",
  ];

  return (
    <>
      {data.length > 0 ? (
        <div className="flex flex-col h-full">
          <div className="h-[220px] relative" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div
                        className="rounded-xl border border-portal-card-border bg-natural-0 shadow-lg px-3 py-2 min-w-[120px]"
                        dir="rtl"
                      >
                        <p className="text-[11px] text-portal-note-text">
                          {item.name}
                        </p>
                        <p className="text-sm font-bold text-natural-100">
                          {item.value.toLocaleString()}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-natural-100">
                {total.toLocaleString()}
              </span>
              <span className="text-[11px] text-portal-note-text">مستخدم</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
            {data.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="text-xs text-portal-note-text truncate">
                  {item.name}
                </span>
                <span className="text-xs font-bold text-natural-100 mr-auto">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState icon={BarChart3} title="لا توجد بيانات" />
      )}
    </>
  );
}
