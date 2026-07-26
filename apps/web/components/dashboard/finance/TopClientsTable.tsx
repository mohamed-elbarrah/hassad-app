"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";

import { TrendingUp, ChevronLeft } from "lucide-react";

interface TopClient {
  clientId: string;
  companyName: string;
  revenue: number;
  paymentCount: number;
  invoiceCount: number;
  collectionRate: number;
}

interface Props {
  clients: TopClient[];
  isLoading?: boolean;
}

export function TopClientsTable({ clients, isLoading }: Props) {
  if (isLoading) {
    return (
      <SurfaceCard
        className="border-none shadow-md h-full"
        title="أفضل العملاء"
      >
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-badge-gray-bg rounded-xl" />
          ))}
        </div>
      </SurfaceCard>
    );
  }

  const maxRevenue = Math.max(...clients.map((c) => c.revenue), 1);

  return (
    <SurfaceCard
      className="border-none shadow-md h-full"
      title="أفضل العملاء"
      description="أعلى العملاء من حيث الإيرادات في الفترة المختارة"
      icon={TrendingUp}
    >
      <div className="space-y-3 pt-1">
        {clients.map((client, idx) => {
          const barWidth = (client.revenue / maxRevenue) * 100;
          return (
            <div
              key={client.clientId}
              className="group flex items-center gap-3 p-3 rounded-xl border border-portal-card-border bg-natural-0 hover:border-secondary-300 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-natural-100 truncate">
                    {client.companyName}
                  </span>
                  <span className="text-sm font-bold text-natural-100">
                    <CurrencyDisplay amount={client.revenue} size="sm" />
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-badge-gray-bg overflow-hidden">
                  <div
                    className="h-full rounded-full bg-secondary-500 transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-portal-note-text">
                  <span>
                    {client.invoiceCount} فاتورة · {client.paymentCount} دفعة
                  </span>
                  <div className="flex items-center gap-1">
                    <span>نسبة التحصيل</span>
                    <span
                      className={cn(
                        "font-semibold",
                        client.collectionRate >= 80
                          ? "text-success-600"
                          : client.collectionRate >= 50
                            ? "text-alert-600"
                            : "text-danger-600",
                      )}
                    >
                      {client.collectionRate}%
                    </span>
                  </div>
                </div>
              </div>
              <Link href={`/dashboard/finance/clients/${client.clientId}`}>
                <ChevronLeft className="w-4 h-4 text-portal-note-text group-hover:text-secondary-500 transition-colors shrink-0" />
              </Link>
            </div>
          );
        })}
        {clients.length === 0 && (
          <div className="text-center py-8 text-portal-note-text text-sm">
            لا توجد بيانات عملاء
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
