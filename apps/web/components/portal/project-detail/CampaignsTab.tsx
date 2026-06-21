"use client";

import Link from "next/link";
import { Megaphone, TrendingUp } from "lucide-react";
import {
  useGetPortalCampaignsQuery,
  type PortalCampaign,
} from "@/features/portal/portalApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Skeleton } from "@/components/design-system/Skeleton";
import { mapCampaignStatusToUI } from "@/lib/utils/statusMapping";
import { PLATFORM_LABELS } from "@/lib/utils/campaign-constants";
import { EmptyState } from "./EmptyState";

function fmt(n: number) {
  return n.toLocaleString("ar-SA-u-nu-latn");
}

function CampaignCard({ campaign }: { campaign: PortalCampaign }) {
  return (
    <Link
      href={`/portal/campaigns/${campaign.id}`}
      className="block rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 p-5 transition-colors hover:border-secondary-500/50"
    >
      <div className="flex items-center justify-between border-b-[1.5px] border-portal-divider pb-3">
        <h3 className="text-base font-semibold text-natural-100">
          {campaign.name}
        </h3>
        <StatusBadge status={mapCampaignStatusToUI(campaign.status)} />
      </div>
      <p className="mt-2 text-xs text-portal-note-text">
        {PLATFORM_LABELS[campaign.platform] ?? campaign.platform}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
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
      </div>

      <div className="mt-3 border-t-[1.5px] border-portal-divider pt-3 text-xs text-portal-note-text">
        الميزانية: {fmt(campaign.budgetTotal)} ر.س | المنفق:{" "}
        {fmt(campaign.budgetSpent)} ر.س
      </div>
    </Link>
  );
}

/** Campaigns tab — all of the client's campaigns (period filtering deferred). */
export function CampaignsTab() {
  const { data: campaigns, isLoading } = useGetPortalCampaignsQuery();

  if (isLoading) {
    return (
      <SurfaceCard title="الحملات" icon={Megaphone}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 p-5"
            >
              <Skeleton className="mb-4 h-6 w-3/4" />
              <Skeleton className="mb-2 h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </SurfaceCard>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="لا توجد حملات حالياً"
        description="ستظهر هنا جميع الحملات الإعلانية المرتبطة بحسابك بمجرد إطلاقها."
      />
    );
  }

  return (
    <SurfaceCard title="الحملات" icon={Megaphone}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" dir="rtl">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </SurfaceCard>
  );
}