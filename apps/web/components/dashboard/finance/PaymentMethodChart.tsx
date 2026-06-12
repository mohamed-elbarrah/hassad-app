"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface PaymentMethodItem {
  method: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

interface Props {
  data: PaymentMethodItem[];
  isLoading?: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

export function PaymentMethodChart({ data, isLoading }: Props) {
  const total = useMemo(() => data.reduce((s, d) => s + d.amount, 0), [data]);
  const totalCount = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);

  if (isLoading) {
    return (
      <SurfaceCard className="border-none shadow-md h-full" title="طرق الدفع">
        <div className="h-[250px] animate-pulse bg-neutral-100 rounded-xl" />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      className="border-none shadow-md h-full"
      title="طرق الدفع"
      description="توزيع المدفوعات حسب طريقة الدفع"
      icon={CreditCard}
    >
      <div className="flex flex-col items-center">
        <div className="relative w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="amount"
                stroke="none"
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name: string, props: any) => [
                  formatCurrency(value),
                  props.payload.label,
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-natural-100">{totalCount}</span>
            <span className="text-[10px] text-neutral-400">عملية</span>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-2 mt-2">
          {data.map((item, idx) => (
            <div key={item.method} className="flex items-center gap-2 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-natural-100 font-medium">{item.label}</p>
                <p className="text-neutral-400">
                  {formatCurrency(item.amount)} · {item.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}
