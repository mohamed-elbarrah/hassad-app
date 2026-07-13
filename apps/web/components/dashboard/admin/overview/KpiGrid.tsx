"use client";

import type { LucideIcon } from "lucide-react";
import { Users, CheckCircle, UserPlus, DollarSign, Activity, ClipboardCheck, AlertCircle, Clock } from "lucide-react";
import { StatCard } from "@/components/design-system/StatCard";
import type { PillTone } from "@/components/design-system/Pill";
import { formatNumber, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminStats, AdminTrendsResponse } from "@/features/admin/adminApi";

export interface KpiConfig {
  key: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  description?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  href: string;
  pill?: { text: string; tone: PillTone };
}

interface KpiGridProps {
  items: KpiConfig[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnsMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function KpiGrid({ items, columns = 4, className }: KpiGridProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("grid gap-4", columnsMap[columns], className)}>
      {items.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          value={card.value}
          icon={card.icon}
          variant={card.variant}
          trend={card.trend}
          trendValue={card.trendValue}
          description={card.description}
          sparklineData={card.sparklineData}
          sparklineColor={card.sparklineColor}
          href={card.href}
          pill={card.pill}
        />
      ))}
    </div>
  );
}

function deltaToTrend(
  delta: number | null | undefined,
): { trend: "up" | "down" | "neutral"; trendValue: string } | null {
  if (delta == null) return null;
  const abs = Math.abs(delta);
  const formatted = `${delta > 0 ? "+" : ""}${abs}%`;

  if (delta > 1) return { trend: "up", trendValue: formatted };
  if (delta < -1) return { trend: "down", trendValue: formatted };
  return { trend: "neutral", trendValue: formatted };
}

export function buildAdminKpiConfigs(
  stats: AdminStats | undefined,
  trends: AdminTrendsResponse | undefined,
): KpiConfig[] {
  if (!stats) return [];

  const d = stats.deltas;

  return [
    {
      key: "activeUsers",
      title: "المستخدمون النشطون",
      value: formatNumber(stats.totalUsers),
      icon: Users,
      href: "/dashboard/admin/users",
      description: "إجمالي المستخدمين",
    },
    {
      key: "activeClients",
      title: "العملاء النشطون",
      value: formatNumber(stats.activeClients),
      icon: CheckCircle,
      variant: "success",
      href: "/dashboard/admin/clients",
    },
    {
      key: "newClients",
      title: "العملاء الجدد",
      value: formatNumber(stats.newClientsThisMonth),
      icon: UserPlus,
      href: "/dashboard/admin/clients",
      ...(deltaToTrend(d?.newClientsThisMonth) ?? {}),
      description: "هذا الشهر",
    },
    {
      key: "monthlyRevenue",
      title: "الإيرادات الشهرية",
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      variant: "success",
      href: "/dashboard/admin/finance",
      sparklineData: trends?.revenue,
      sparklineColor: "#10B981",
      ...(deltaToTrend(d?.monthlyRevenue ?? stats.revenueChange) ?? {}),
      pill: d?.monthlyRevenue != null
        ? {
            text: `${d.monthlyRevenue > 0 ? "+" : ""}${d.monthlyRevenue}%`,
            tone: d.monthlyRevenue > 0 ? "success" : "danger",
          }
        : undefined,
    },
    {
      key: "activeProjects",
      title: "المشاريع الجارية",
      value: formatNumber(stats.activeProjects),
      icon: Activity,
      variant: "success",
      href: "/dashboard/admin/projects",
      ...(deltaToTrend(d?.activeProjects) ?? {}),
    },
    {
      key: "completedProjects",
      title: "المشاريع المكتملة",
      value: formatNumber(stats.completedProjects),
      icon: ClipboardCheck,
      href: "/dashboard/admin/projects",
      ...(deltaToTrend(d?.completedProjects) ?? {}),
    },
    {
      key: "overdueInvoices",
      title: "الفواتير المتأخرة",
      value: formatNumber(stats.unpaidInvoicesCount),
      icon: AlertCircle,
      variant: "danger",
      href: "/dashboard/admin/finance",
      ...(deltaToTrend(d?.unpaidInvoicesCount) ?? {}),
      pill: stats.unpaidInvoicesCount > 0
        ? { text: "عاجل", tone: "danger" as PillTone }
        : undefined,
    },
    {
      key: "overdueTasks",
      title: "المهام المتأخرة",
      value: formatNumber(stats.overdueTasks),
      icon: Clock,
      variant: "danger",
      href: "/dashboard/admin/tasks",
      ...(deltaToTrend(d?.overdueTasks) ?? {}),
      pill: stats.overdueTasks > 0
        ? { text: "عاجل", tone: "danger" as PillTone }
        : undefined,
    },
  ];
}
