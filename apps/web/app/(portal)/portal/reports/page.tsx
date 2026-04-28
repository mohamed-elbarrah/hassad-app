"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetCampaignsQuery, useGetCampaignKpisQuery } from "@/features/campaigns/campaignsApi";
import type { Campaign } from "@/features/campaigns/campaignsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "تخطيط",
  ACTIVE: "نشطة",
  PAUSED: "متوقفة",
  COMPLETED: "منتهية",
};

const PLATFORM_LABELS: Record<string, string> = {
  META: "Meta",
  GOOGLE: "Google",
  SNAPCHAT: "Snapchat",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
};

function fmt(n?: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("ar-DZ");
}

function CampaignReport({ campaign }: { campaign: Campaign }) {
  const { data: kpis, isLoading } = useGetCampaignKpisQuery(campaign.id);

  const totals = kpis?.reduce(
    (acc, k) => ({
      impressions: acc.impressions + (k.impressions ?? 0),
      clicks: acc.clicks + (k.clicks ?? 0),
      messagesReceived: acc.messagesReceived + (k.messagesReceived ?? 0),
      ordersCount: acc.ordersCount + (k.ordersCount ?? 0),
    }),
    { impressions: 0, clicks: 0, messagesReceived: 0, ordersCount: 0 },
  );

  const kpiItems = [
    { label: "الظهور", value: isLoading ? null : fmt(totals?.impressions) },
    { label: "النقرات", value: isLoading ? null : fmt(totals?.clicks) },
    { label: "الرسائل", value: isLoading ? null : fmt(totals?.messagesReceived) },
    { label: "الطلبات", value: isLoading ? null : fmt(totals?.ordersCount) },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{campaign.name}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {PLATFORM_LABELS[campaign.platform] ?? campaign.platform}
            </span>
            <Badge variant="secondary">
              {STATUS_LABELS[campaign.status] ?? campaign.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpiItems.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              {item.value == null ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <span className="text-sm font-semibold" dir="ltr">{item.value}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PortalReportsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const { data, isLoading, isError } = useGetCampaignsQuery(
    { clientId, limit: 10 },
    { skip: !clientId },
  );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">التقارير</h1>
        <p className="text-sm text-muted-foreground mt-1">
          تقارير الحملات الإعلانية حسب المنصة.
        </p>
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">
          لم يتم ربط حسابك بملف عميل.
        </p>
      )}

      {clientId && (
        <>
          {isLoading && (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">حدث خطأ أثناء تحميل الحملات.</p>
          )}
          {!isLoading && !isError && data && (
            <>
              {data.items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لا توجد حملات إعلانية حتى الآن.
                </p>
              )}
              <div className="flex flex-col gap-4">
                {data.items.map((campaign) => (
                  <CampaignReport key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
