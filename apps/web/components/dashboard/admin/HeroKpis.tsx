"use client";

import Link from "next/link";
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { KpiPill, KpiCurrency } from "@/components/design-system/KpiPill";
import { Skeleton } from "@/components/design-system/Skeleton";

function TrendArrow({ value }: { value?: number }) {
  if (value == null || value === 0)
    return <Minus className="w-3.5 h-3.5 text-neutral-300" />;
  if (value > 0)
    return <ArrowUpRight className="w-3.5 h-3.5 text-success-600" />;
  return <ArrowDownRight className="w-3.5 h-3.5 text-danger-500" />;
}

interface HeroKpisProps {
  stats?: {
    monthlyRevenue?: number;
    revenueChange?: number;
    totalUsers?: number;
    recentUsers?: number;
    activeClients?: number;
    newClientsThisMonth?: number;
    activeProjects?: number;
  };
  isLoading: boolean;
}

export function HeroKpis({ stats, isLoading }: HeroKpisProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Link href="/dashboard/admin/finance">
        <div className="min-w-[132px] rounded-2xl px-4 py-3 bg-gradient-to-bl from-primary-100 to-primary-200/60 ring-1 ring-inset ring-primary-300/60 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary-700">
            <DollarSign className="h-3.5 w-3.5" />
            <span>الإيرادات الشهرية</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <KpiCurrency
              amount={stats?.monthlyRevenue}
              className="text-primary-800"
            />
            <TrendArrow value={stats?.revenueChange} />
          </div>
          {stats?.revenueChange != null && (
            <p className="text-[11px] text-primary-700/70 mt-1">
              {Math.abs(stats.revenueChange)}% عن الشهر الماضي
            </p>
          )}
        </div>
      </Link>

      <Link href="/dashboard/admin/users">
        <div className="transition-all hover:shadow-lg hover:-translate-y-0.5">
          <KpiPill
            label="المستخدمين"
            value={
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-natural-100">
                  {stats?.totalUsers?.toLocaleString() ?? "—"}
                </span>
                <TrendArrow value={stats?.recentUsers} />
              </div>
            }
          />
        </div>
      </Link>

      <Link href="/dashboard/admin/clients">
        <div className="transition-all hover:shadow-lg hover:-translate-y-0.5">
          <KpiPill
            label="العملاء النشطين"
            value={
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-natural-100">
                  {stats?.activeClients?.toLocaleString() ?? "—"}
                </span>
                <TrendArrow value={stats?.newClientsThisMonth} />
              </div>
            }
          />
        </div>
      </Link>

      <Link href="/dashboard/admin/projects">
        <div className="transition-all hover:shadow-lg hover:-translate-y-0.5">
          <KpiPill
            label="المشاريع الجارية"
            value={
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-natural-100">
                  {stats?.activeProjects?.toLocaleString() ?? "—"}
                </span>
              </div>
            }
          />
        </div>
      </Link>
    </div>
  );
}
