"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import {
  useGetPortalCampaignQuery,
  type PortalCampaignDetail,
} from "@/features/portal/portalApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { mapCampaignStatusToUI } from "@/lib/utils/statusMapping";

interface PageProps {
  params: Promise<{ id: string }>;
}

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE: "Google Ads",
  META: "Meta (Facebook/Instagram)",
  TIKTOK: "TikTok",
  SNAPCHAT: "Snapchat",
};

function fmt(n: number) {
  return n.toLocaleString("ar-SA-u-nu-latn");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PortalCampaignDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const {
    data: campaign,
    isLoading,
    isError,
    refetch,
  } = useGetPortalCampaignQuery(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <Skeleton className="h-6 w-48" />
        <PortalSurfaceCard icon={TrendingUp}>
          <div className="space-y-4">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="mt-2 h-4 w-40" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-2xl" />
          </div>
        </PortalSurfaceCard>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/portal/campaigns">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            الحملات الإعلانية
          </Button>
        </Link>
        <PortalSurfaceCard title="تعذر تحميل الحملة" icon={AlertCircle}>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-portal-note-text">
              {isError
                ? "تعذر تحميل بيانات الحملة. يرجى المحاولة مرة أخرى."
                : "الحملة غير موجودة."}
            </p>
            {isError && (
              <Button
                variant="ghost"
                className="h-9 rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 text-xs font-medium text-portal-icon hover:bg-badge-gray-bg"
                onClick={() => refetch()}
              >
                إعادة المحاولة
              </Button>
            )}
          </div>
        </PortalSurfaceCard>
      </div>
    );
  }

  const campaignData = campaign as PortalCampaignDetail;
  const snapshots = campaignData.kpiSnapshots ?? [];
  const chronologicalSnapshots = [...snapshots].reverse();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/portal/campaigns">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            الحملات الإعلانية
          </Button>
        </Link>
        <span className="text-portal-note-text">/</span>
        <span className="max-w-xs truncate text-sm font-medium text-natural-100">
          {campaignData.name}
        </span>
      </div>

      {/* Main card */}
      <PortalSurfaceCard
        title={campaignData.name}
        icon={TrendingUp}
        action={
          <StatusBadge status={mapCampaignStatusToUI(campaignData.status)} />
        }
      >
        <div className="space-y-5">
          <p className="text-sm text-portal-note-text">
            {PLATFORM_LABELS[campaignData.platform] ?? campaignData.platform}
            {" · "}
            {formatDate(campaignData.startDate)}
            {campaignData.endDate
              ? ` — ${formatDate(campaignData.endDate)}`
              : ""}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-portal-card-border bg-portal-bg p-4">
              <DollarSign className="h-5 w-5 shrink-0 text-portal-note-text" />
              <div>
                <p className="text-xs text-portal-note-text">
                  الميزانية الكلية
                </p>
                <p className="text-lg font-semibold text-natural-100">
                  {fmt(campaignData.budgetTotal)} ر.س
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-portal-card-border bg-portal-bg p-4">
              <TrendingUp className="h-5 w-5 shrink-0 text-portal-note-text" />
              <div>
                <p className="text-xs text-portal-note-text">
                  الميزانية المنفقة
                </p>
                <p className="text-lg font-semibold text-natural-100">
                  {fmt(campaignData.budgetSpent)} ر.س
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-portal-card-border bg-portal-bg p-4">
              <Calendar className="h-5 w-5 shrink-0 text-portal-note-text" />
              <div>
                <p className="text-xs text-portal-note-text">تاريخ البدء</p>
                <p className="text-lg font-semibold text-natural-100">
                  {formatDate(campaignData.startDate)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-natural-100">
              أداء الحملة الحالي
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              <AnalyticsItem
                label="الانطباعات"
                value={fmt(campaignData.analytics?.impressions ?? 0)}
              />
              <AnalyticsItem
                label="النقرات"
                value={fmt(campaignData.analytics?.clicks ?? 0)}
              />
              <AnalyticsItem
                label="التحويلات"
                value={fmt(campaignData.analytics?.conversions ?? 0)}
              />
              <AnalyticsItem
                label="العائد ROAS"
                value={`${campaignData.analytics?.roas?.toFixed(1) ?? "0"}x`}
              />
              <AnalyticsItem
                label="نسبة النقر CTR"
                value={`${campaignData.analytics?.ctr?.toFixed(2) ?? "0"}%`}
              />
              <AnalyticsItem
                label="تكلفة النقرة CPC"
                value={`${campaignData.analytics?.cpc?.toFixed(2) ?? "0"} ر.س`}
              />
              <AnalyticsItem
                label="تكلفة التحويل CPA"
                value={`${campaignData.analytics?.cpa?.toFixed(2) ?? "0"} ر.س`}
              />
              <AnalyticsItem
                label="الإيرادات"
                value={`${fmt(campaignData.analytics?.revenue ?? 0)} ر.س`}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-natural-100">
              حالة الحملة
            </h3>
            <div className="flex items-center gap-3 rounded-2xl border border-portal-card-border p-4">
              <div
                className={`h-3 w-3 rounded-full ${
                  campaignData.status === "ACTIVE"
                    ? "bg-badge-green-text"
                    : campaignData.status === "COMPLETED"
                      ? "bg-action-blue"
                      : campaignData.status === "PAUSED" ||
                          campaignData.status === "STOPPED"
                        ? "bg-badge-orange-text"
                        : "bg-portal-note-text"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-natural-100">
                  <StatusBadge
                    status={mapCampaignStatusToUI(campaignData.status)}
                  />
                </p>
                <p className="text-xs text-portal-note-text">
                  آخر تحديث: {formatDate(campaignData.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PortalSurfaceCard>

      {/* KPI Snapshots */}
      <PortalSurfaceCard
        title="سجل مؤشرات الأداء"
        description="جميع قياسات الأداء المسجلة مرتبة من الأقدم إلى الأحدث"
        icon={TrendingUp}
      >
        {chronologicalSnapshots.length === 0 ? (
          <p className="py-6 text-center text-sm text-portal-note-text">
            لا توجد قياسات أداء مسجلة لهذه الحملة حتى الآن.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b-[1.5px] border-portal-divider text-portal-note-text">
                  <th className="px-5 py-4 font-medium">التاريخ</th>
                  <th className="px-5 py-4 font-medium">الانطباعات</th>
                  <th className="px-5 py-4 font-medium">النقرات</th>
                  <th className="px-5 py-4 font-medium">التحويلات</th>
                  <th className="px-5 py-4 font-medium">CTR</th>
                  <th className="px-5 py-4 font-medium">CPC</th>
                  <th className="px-5 py-4 font-medium">ROAS</th>
                  <th className="px-5 py-4 font-medium">المصدر</th>
                </tr>
              </thead>
              <tbody>
                {chronologicalSnapshots.map((snap) => (
                  <tr
                    key={snap.id}
                    className="border-b-[1.5px] border-portal-divider"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      {formatDate(snap.recordedAt)}
                    </td>
                    <td className="px-5 py-4">{fmt(snap.impressions)}</td>
                    <td className="px-5 py-4">{fmt(snap.clicks)}</td>
                    <td className="px-5 py-4">{fmt(snap.conversions)}</td>
                    <td className="px-5 py-4">{snap.ctr.toFixed(2)}%</td>
                    <td className="px-5 py-4">{snap.cpc.toFixed(2)} ر.س</td>
                    <td className="px-5 py-4">{snap.roas.toFixed(1)}x</td>
                    <td className="px-5 py-4 text-xs text-portal-note-text">
                      {snap.source ?? "يدوي"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PortalSurfaceCard>
    </div>
  );
}

function AnalyticsItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-portal-card-border bg-portal-bg p-3 text-center">
      <p className="text-xs text-portal-note-text">{label}</p>
      <p className="mt-1 text-sm font-semibold text-natural-100">{value}</p>
    </div>
  );
}
