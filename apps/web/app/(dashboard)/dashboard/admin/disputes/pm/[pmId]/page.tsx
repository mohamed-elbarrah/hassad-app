"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  User,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import {
  useGetPmDisputeStatsQuery,
  useGetAdminDisputesQuery,
} from "@/features/disputes/adminDisputesApi";
import { useGetUserByIdQuery } from "@/features/users/usersApi";
import type { DisputeStatus } from "@hassad/shared";
import { DISPUTE_STATUS_AR } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { DisputeStatusBadge } from "@/components/disputes";
import { formatDate } from "@/lib/format";

interface PmStatsPageProps {
  params: Promise<{ pmId: string }>;
}

export default function PmStatsPage({ params }: PmStatsPageProps) {
  const { pmId } = use(params);

  // Fetch PM details
  const { data: pmUser, isLoading: isLoadingUser } = useGetUserByIdQuery(pmId);

  // Fetch PM dispute stats
  const { data: stats, isLoading: isLoadingStats } =
    useGetPmDisputeStatsQuery(pmId);

  // Fetch disputes for this PM
  const { data: disputesData, isLoading: isLoadingDisputes } =
    useGetAdminDisputesQuery({
      pmId,
      limit: 50,
    });

  const isLoading = isLoadingUser || isLoadingStats || isLoadingDisputes;
  const disputes = disputesData?.data ?? [];

  // Calculate resolution rate
  const resolutionRate =
    stats && stats.totalDisputes > 0
      ? Math.round((stats.resolvedDisputes / stats.totalDisputes) * 100)
      : 0;

  // Calculate escalation rate
  const escalationRate =
    stats && stats.totalDisputes > 0
      ? Math.round((stats.escalatedDisputes / stats.totalDisputes) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/admin/disputes"
          className="flex items-center gap-1 text-sm text-portal-note-text hover:text-secondary-500 transition-colors w-fit"
        >
          <ArrowRight className="h-4 w-4" />
          العودة لإدارة النزاعات
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <User className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-natural-100">
              {isLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                `إحصائيات ${pmUser?.name ?? "المدير"}`
              )}
            </h1>
            <p className="text-sm text-portal-note-text">
              سجل النزاعات والأداء
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="إجمالي النزاعات"
          value={stats?.totalDisputes ?? 0}
          color="blue"
          isLoading={isLoading}
        />
        <StatsCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="تم الحل"
          value={stats?.resolvedDisputes ?? 0}
          suffix={resolutionRate > 0 ? `${resolutionRate}%` : undefined}
          color="green"
          isLoading={isLoading}
        />
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="تم التصعيد"
          value={stats?.escalatedDisputes ?? 0}
          suffix={escalationRate > 0 ? `${escalationRate}%` : undefined}
          color="red"
          isLoading={isLoading}
        />
        <StatsCard
          icon={<XCircle className="h-5 w-5" />}
          label="تغيير المدير"
          value={stats?.pmChangedCount ?? 0}
          color="amber"
          isLoading={isLoading}
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          label="متوسط الحل"
          value={stats?.avgResolutionDays.toFixed(1) ?? "0"}
          suffix="يوم"
          color="purple"
          isLoading={isLoading}
        />
      </div>

      {/* ── Resolution Rate Card ─────────────────────────────────────────────── */}
      {stats && (
        <SurfaceCard className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-secondary-500" />
            <h2 className="text-lg font-semibold text-natural-100">
              معدل الحل
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-natural-100">
              {resolutionRate}%
            </span>
          </div>
          <p className="text-sm text-portal-note-text mt-2">
            {stats.resolvedDisputes} من {stats.totalDisputes} نزاع تم حله بنجاح
          </p>
        </SurfaceCard>
      )}

      {/* ── Disputes History ─────────────────────────────────────────────────── */}
      <SurfaceCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-5 w-5 text-secondary-500" />
          <h2 className="text-lg font-semibold text-natural-100">
            سجل النزاعات
          </h2>
        </div>

        <DataTable
          columns={[
            { id: "ticket", label: "التذكرة" },
            { id: "title", label: "العنوان" },
            { id: "project", label: "المشروع" },
            { id: "status", label: "الحالة" },
            { id: "opened", label: "تاريخ الفتح", align: "left" },
            { id: "resolved", label: "تاريخ الحل", align: "left" },
          ]}
          data={disputes}
          isLoading={isLoading}
          isError={false}
          emptyState={{
            icon: BarChart3,
            message: "لا توجد نزاعات",
            hint: "لم يسجل هذا المدير أي نزاعات بعد",
          }}
          renderRow={(dispute) => (
            <tr
              key={dispute.id}
              className="border-b-[1.5px] border-portal-divider"
            >
              <td className="px-5 py-4">
                <Link
                  href={`/dashboard/admin/disputes/${dispute.id}`}
                  className="text-sm font-medium text-secondary-500 hover:underline"
                >
                  #{dispute.ticketNumber.toString().padStart(3, "0")}
                </Link>
              </td>
              <td className="px-5 py-4 text-sm text-natural-100 max-w-[200px] truncate">
                {dispute.title}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text truncate">
                {dispute.project.name}
              </td>
              <td className="px-5 py-4">
                <DisputeStatusBadge status={dispute.status} />
              </td>
              <td
                className="px-5 py-4 text-sm text-portal-note-text text-left"
                dir="ltr"
              >
                {formatDate(dispute.openedAt)}
              </td>
              <td
                className="px-5 py-4 text-sm text-portal-note-text text-left"
                dir="ltr"
              >
                {dispute.resolvedAt ? formatDate(dispute.resolvedAt) : "—"}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}

// ─── Stats Card Component ─────────────────────────────────────────────────────

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color: "blue" | "green" | "red" | "amber" | "purple";
  isLoading?: boolean;
}

const STATS_COLORS = {
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  green: { bg: "bg-green-100", icon: "text-green-600" },
  red: { bg: "bg-red-100", icon: "text-red-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600" },
};

function StatsCard({
  icon,
  label,
  value,
  suffix,
  color,
  isLoading,
}: StatsCardProps) {
  const colors = STATS_COLORS[color];

  if (isLoading) {
    return (
      <SurfaceCard className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg}`}
        >
          <span className={colors.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-xl font-bold text-natural-100">
            {value}
            {suffix && (
              <span className="text-sm font-normal text-portal-note-text mr-1">
                {suffix}
              </span>
            )}
          </p>
          <p className="text-sm text-portal-note-text">{label}</p>
        </div>
      </div>
    </SurfaceCard>
  );
}
