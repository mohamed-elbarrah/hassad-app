"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, AlertCircle } from "lucide-react";
import {
  useGetPortalCampaignQuery,
  type PortalCampaignDetail,
} from "@/features/portal/portalApi";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { KpiPill, KpiCurrency } from "@/components/design-system/KpiPill";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import { PLATFORM_LABELS } from "@/lib/utils/campaign-constants";
import { mapCampaignStatusToUI } from "@/lib/utils/statusMapping";
import { useCurrency } from "@/hooks/useCurrency";

interface PageProps {
  params: Promise<{ id: string }>;
}

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
  const { fmtAmount, fmtNumber, currency } = useCurrency();
  const {
    data: campaign,
    isLoading,
    isError,
    refetch,
  } = useGetPortalCampaignQuery(id, { pollingInterval: 30_000 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <Skeleton className="h-6 w-48" />
        <SurfaceCard icon={TrendingUp}>
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
        </SurfaceCard>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/portal/campaigns">
          <ActionButton
            variant="ghost"
            size="sm"
            className="gap-2 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            الحملات الإعلانية
          </ActionButton>
        </Link>
        <SurfaceCard title="تعذر تحميل الحملة" icon={AlertCircle}>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-portal-note-text">
              {isError
                ? "تعذر تحميل بيانات الحملة. يرجى المحاولة مرة أخرى."
                : "الحملة غير موجودة."}
            </p>
            {isError && (
              <ActionButton
                variant="ghost"
                className="h-9 rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 text-xs font-medium text-portal-icon hover:bg-badge-gray-bg"
                onClick={() => refetch()}
              >
                إعادة المحاولة
              </ActionButton>
            )}
          </div>
        </SurfaceCard>
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
          <ActionButton
            variant="ghost"
            size="sm"
            className="gap-1.5 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            الحملات الإعلانية
          </ActionButton>
        </Link>
        <span className="text-portal-note-text">/</span>
        <span className="max-w-xs truncate text-sm font-medium text-natural-100">
          {campaignData.name}
        </span>
      </div>

      {/* Main card */}
      <SurfaceCard
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
            <KpiPill
              label="الميزانية الكلية"
              value={<KpiCurrency amount={campaignData.budgetTotal} />}
            />
            <KpiPill
              label="الميزانية المنفقة"
              value={<KpiCurrency amount={campaignData.budgetSpent} />}
            />
            <KpiPill
              label="تاريخ البدء"
              value={
                <span className="text-lg font-semibold text-natural-100">
                  {formatDate(campaignData.startDate)}
                </span>
              }
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-natural-100">
              أداء الحملة الحالي
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              <InfoPanel variant="default" className="text-center">
                <p className="text-xs text-portal-note-text">الانطباعات</p>
                <p className="mt-1 text-sm font-semibold text-natural-100">
                  {fmt(campaignData.analytics?.impressions ?? 0)}
                </p>
              </InfoPanel>
              <InfoPanel variant="default" className="text-center">
                <p className="text-xs text-portal-note-text">النقرات</p>
                <p className="mt-1 text-sm font-semibold text-natural-100">
                  {fmt(campaignData.analytics?.clicks ?? 0)}
                </p>
              </InfoPanel>
              <InfoPanel variant="default" className="text-center">
                <p className="text-xs text-portal-note-text">التحويلات</p>
                <p className="mt-1 text-sm font-semibold text-natural-100">
                  {fmt(campaignData.analytics?.conversions ?? 0)}
                </p>
              </InfoPanel>
              <InfoPanel variant="default" className="text-center">
                <p className="text-xs text-portal-note-text">العائد ROAS</p>
                <p className="mt-1 text-sm font-semibold text-natural-100">
                  {campaignData.analytics?.roas?.toFixed(1) ?? "0"}x
                </p>
              </InfoPanel>
              <InfoPanel variant="default" className="text-center">
                <p className="text-xs text-portal-note-text">نسبة النقر CTR</p>
                <p className="mt-1 text-sm font-semibold text-natural-100">
                  {campaignData.analytics?.ctr?.toFixed(2) ?? "0"}%
                </p>
              </InfoPanel>
              <InfoPanel variant="default" className="text-center">
                <p className="text-xs text-portal-note-text">
                  تكلفة النقرة CPC
                </p>
                <p className="mt-1 text-sm font-semibold text-natural-100">
                  {campaignData.analytics?.cpc?.toFixed(2) ?? "0"} ر.س
                </p>
              </InfoPanel>
              <InfoPanel variant="default" className="text-center">
                <p className="text-xs text-portal-note-text">
                  تكلفة التحويل CPA
                </p>
                <p className="mt-1 text-sm font-semibold text-natural-100">
                  {campaignData.analytics?.cpa?.toFixed(2) ?? "0"} ر.س
                </p>
              </InfoPanel>
              <InfoPanel variant="default" className="text-center">
                <p className="text-xs text-portal-note-text">الإيرادات</p>
                <p className="mt-1 text-sm font-semibold text-natural-100">
                  {fmt(campaignData.analytics?.revenue ?? 0)} ر.س
                </p>
              </InfoPanel>
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
      </SurfaceCard>

      {/* KPI Snapshots */}
      <SurfaceCard
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
      </SurfaceCard>
    </div>
  );
}
