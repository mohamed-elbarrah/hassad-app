"use client";

import { useAppSelector } from "@/lib/hooks";
import {
  useGetPortalCampaignsQuery,
  type PortalCampaign,
} from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { mapCampaignStatusToUI } from "@/lib/utils/statusMapping";
import { PLATFORM_LABELS } from "@/lib/utils/campaign-constants";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("ar-SA-u-nu-latn");
}

export default function PortalCampaignsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const {
    data: campaigns,
    isLoading,
    isError,
    refetch,
  } = useGetPortalCampaignsQuery(undefined, {
    skip: !clientId,
    pollingInterval: 30_000,
  });

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الحملات الإعلانية"
        description="جميع الحملات الإعلانية المرتبطة بحسابك مع مؤشرات الأداء الرئيسية لكل حملة."
        icon={TrendingUp}
      />

      {!clientId && (
        <div className="rounded-2xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center">
          <p className="text-base font-medium text-danger-700">
            لم يتم ربط حسابك بملف عميل.
          </p>
        </div>
      )}

      {clientId && isError && !isLoading && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="rounded-2xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center max-w-md w-full">
            <p className="text-base font-medium text-danger-700">
              تعذر تحميل الحملات. يرجى المحاولة مرة أخرى.
            </p>
            <ActionButton
              variant="secondary"
              size="md"
              onClick={() => refetch()}
              className="mt-3"
            >
              إعادة المحاولة
            </ActionButton>
          </div>
        </div>
      )}

      {clientId && (
        <SurfaceCard title="قائمة الحملات" icon={TrendingUp}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 p-5"
                >
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}

            {!isLoading && campaigns && campaigns.length === 0 && (
              <div className="col-span-full flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
                  <TrendingUp className="h-8 w-8 text-secondary-500" />
                </div>
                <p className="text-lg font-medium text-natural-100">
                  لا توجد حملات حالياً.
                </p>
                <p className="max-w-md text-sm leading-6 text-portal-note-text">
                  ستظهر هنا جميع الحملات الإعلانية المرتبطة بحسابك بمجرد
                  إطلاقها.
                </p>
              </div>
            )}

            {!isLoading &&
              campaigns?.map((campaign: PortalCampaign) => (
                <Link
                  key={campaign.id}
                  href={`/portal/campaigns/${campaign.id}`}
                  className="block"
                >
                  <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 p-5 hover:border-secondary-500/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-portal-divider">
                      <h3 className="text-base font-semibold text-natural-100">
                        {campaign.name}
                      </h3>
                      <StatusBadge
                        status={mapCampaignStatusToUI(campaign.status)}
                      />
                    </div>
                    <p className="text-xs text-portal-note-text mt-2">
                      {PLATFORM_LABELS[campaign.platform] ?? campaign.platform}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                      <div>
                        <p className="text-portal-note-text">الانطباعات</p>
                        <p className="font-medium text-natural-100">
                          {fmt(campaign.analytics?.impressions ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-portal-note-text">النقرات</p>
                        <p className="font-medium text-natural-100">
                          {fmt(campaign.analytics?.clicks ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-portal-note-text">التحويلات</p>
                        <p className="font-medium text-natural-100">
                          {fmt(campaign.analytics?.conversions ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-portal-note-text">العائد ROAS</p>
                        <p className="font-medium text-natural-100">
                          {campaign.analytics?.roas?.toFixed(1) ?? "0"}x
                        </p>
                      </div>
                      <div>
                        <p className="text-portal-note-text">نسبة النقر CTR</p>
                        <p className="font-medium text-natural-100">
                          {campaign.analytics?.ctr?.toFixed(2) ?? "0"}%
                        </p>
                      </div>
                      <div>
                        <p className="text-portal-note-text">
                          تكلفة النقرة CPC
                        </p>
                        <p className="font-medium text-natural-100">
                          {campaign.analytics?.cpc?.toFixed(2) ?? "0"} ر.س
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t-[1.5px] border-portal-divider text-xs text-portal-note-text">
                      الميزانية: {fmt(campaign.budgetTotal)} ر.س | المنفق:{" "}
                      {fmt(campaign.budgetSpent)} ر.س
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
