"use client";

import Link from "next/link";
import { User, BarChart3, Clock, AlertTriangle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PmDisputeStats } from "@/features/disputes/adminDisputesApi";
import { Skeleton } from "@/components/design-system/Skeleton";

interface PmStatsPanelProps {
  stats: PmDisputeStats | undefined;
  isLoading: boolean;
  pmId: string;
  showLink?: boolean;
}

export function PmStatsPanel({
  stats,
  isLoading,
  pmId,
  showLink = true,
}: PmStatsPanelProps) {
  if (isLoading) {
    return <PmStatsPanelSkeleton />;
  }

  if (!stats) {
    return null;
  }

  const resolutionRate =
    stats.totalDisputes > 0
      ? Math.round((stats.resolvedDisputes / stats.totalDisputes) * 100)
      : 0;

  return (
    <div
      className="rounded-[24px] border-[1.5px] border-portal-divider bg-natural-0 p-5"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100">
          <User className="h-4 w-4 text-secondary-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-natural-100">
            إحصائيات المدير
          </p>
          <p className="text-xs text-portal-note-text">{stats.userName}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem
          icon={<BarChart3 className="h-4 w-4" />}
          label="إجمالي النزاعات"
          value={stats.totalDisputes}
          color="blue"
        />
        <StatItem
          icon={<BarChart3 className="h-4 w-4" />}
          label="تم الحل"
          value={stats.resolvedDisputes}
          suffix={resolutionRate > 0 ? `${resolutionRate}%` : undefined}
          color="green"
        />
        <StatItem
          icon={<AlertTriangle className="h-4 w-4" />}
          label="تم التصعيد"
          value={stats.escalatedDisputes}
          color="red"
        />
        <StatItem
          icon={<Clock className="h-4 w-4" />}
          label="متوسط الحل"
          value={stats.avgResolutionDays.toFixed(1)}
          suffix="يوم"
          color="purple"
        />
      </div>

      {/* PM Changes indicator */}
      {stats.pmChangedCount > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700">
            ⚠️ تم تغيير المدير {stats.pmChangedCount} مرة بسبب نزاعات
          </p>
        </div>
      )}

      {/* Link to full stats */}
      {showLink && (
        <Link
          href={`/dashboard/admin/disputes/pm/${pmId}`}
          className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-secondary-500 hover:text-secondary-600 transition-colors"
        >
          عرض السجل الكامل
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color: "blue" | "green" | "red" | "purple";
}

const COLOR_STYLES = {
  blue: { bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  green: {
    bg: "bg-green-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  red: { bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-600" },
  purple: {
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
};

function StatItem({ icon, label, value, suffix, color }: StatItemProps) {
  const styles = COLOR_STYLES[color];

  return (
    <div className={cn("p-3 rounded-xl", styles.bg)}>
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("p-1 rounded", styles.iconBg)}>
          <span className={cn(styles.iconColor)}>{icon}</span>
        </div>
      </div>
      <p className="text-lg font-bold text-natural-100">
        {value}
        {suffix && (
          <span className="text-sm font-normal text-portal-note-text mr-1">
            {suffix}
          </span>
        )}
      </p>
      <p className="text-xs text-portal-note-text">{label}</p>
    </div>
  );
}

function PmStatsPanelSkeleton() {
  return (
    <div
      className="rounded-[24px] border-[1.5px] border-portal-divider bg-natural-0 p-5"
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
