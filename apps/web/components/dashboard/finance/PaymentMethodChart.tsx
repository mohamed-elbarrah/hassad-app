"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { CreditCard } from "lucide-react";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { useCurrency } from "@/hooks/useCurrency";

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

function ChartTooltip({ active, payload }: any) {
  const { fmtAmount, currency } = useCurrency();
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as PaymentMethodItem;
  return (
    <div className="rounded-lg border border-portal-card-border bg-natural-0 shadow-lg px-3 py-2 min-w-[140px]">
      <p className="text-xs font-bold text-natural-100 mb-1">{item.label}</p>
      <div className="flex items-center gap-1">
        <span className="text-xs text-portal-note-text">
          {fmtAmount(item.amount)}
        </span>
        <span className="text-xs text-portal-note-text">
          · {item.percentage}%
        </span>
      </div>
      <p className="text-[10px] text-portal-note-text mt-0.5">
        {item.count} عملية
      </p>
    </div>
  );
}

export function PaymentMethodChart({ data, isLoading }: Props) {
  const total = useMemo(() => data.reduce((s, d) => s + d.amount, 0), [data]);
  const totalCount = useMemo(
    () => data.reduce((s, d) => s + d.count, 0),
    [data],
  );

  if (isLoading) {
    return (
      <SurfaceCard className="border-none shadow-md h-full" title="طرق الدفع">
        <div className="h-[250px] animate-pulse bg-badge-gray-bg rounded-xl" />
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
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-natural-100">
              {totalCount}
            </span>
            <span className="text-[10px] text-portal-note-text">عملية</span>
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
                <p className="truncate text-natural-100 font-medium">
                  {item.label}
                </p>
                <p className="text-portal-note-text">
                  <CurrencyDisplay amount={item.amount} size="sm" />
                  {" · "}
                  {item.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}
