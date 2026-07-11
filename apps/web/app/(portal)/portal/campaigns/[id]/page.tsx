"use client";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { use } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { DetailBreadcrumb } from "@/components/portal/shared/DetailBreadcrumb";
import { DetailErrorState } from "@/components/portal/shared/DetailErrorState";
import { DetailSkeleton } from "@/components/portal/shared/DetailSkeleton";
import {
  useGetPortalCampaignQuery,
  type PortalCampaignDetail,
} from "@/features/portal/portalApi";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { KpiPill, KpiCurrency } from "@/components/design-system/KpiPill";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import { PLATFORM_LABELS } from "@/lib/utils/campaign-constants";
import { mapCampaignStatusToUI } from "@/lib/utils/statusMapping";
import { useCurrency } from "@/hooks/useCurrency";
import { CampaignStatus } from "@hassad/shared";

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
  } = useGetPortalCampaignQuery(id, {
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });

  if (isLoading) {
    return <DetailSkeleton variant="campaign" />;
  }

  if (isError || !campaign) {
    return (
      <DetailErrorState
        title={isError ? "تعذر تحميل الحملة" : "الحملة غير موجودة"}
        onRetry={isError ? refetch : undefined}
        backHref="/portal/campaigns"
        backLabel="الحملات الإعلانية"
      />
    );
  }

  const campaignData = campaign as PortalCampaignDetail;
  const snapshots = campaignData.kpiSnapshots ?? [];
  const chronologicalSnapshots = [...snapshots].reverse();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <DetailBreadcrumb
        backHref="/portal/campaigns"
        backLabel="الحملات"
        title={campaignData.name}
      />

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
                  campaignData.status === CampaignStatus.ACTIVE
                    ? "bg-badge-green-text"
                    : campaignData.status === CampaignStatus.COMPLETED
                      ? "bg-action-blue"
                      : campaignData.status === CampaignStatus.PAUSED ||
                          campaignData.status === CampaignStatus.STOPPED
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
