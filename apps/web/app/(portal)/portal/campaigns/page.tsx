"use client";

import { useAppSelector } from "@/lib/hooks";
import {
  useGetPortalCampaignsQuery,
  type PortalCampaign,
} from "@/features/portal/portalApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "تخطيط",
  ACTIVE: "نشطة",
  PAUSED: "متوقفة",
  STOPPED: "متوقفة",
  COMPLETED: "مكتملة",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PLANNING: "outline",
  ACTIVE: "default",
  PAUSED: "secondary",
  STOPPED: "destructive",
  COMPLETED: "secondary",
};

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE: "Google Ads",
  META: "Meta (Facebook/Instagram)",
  TIKTOK: "TikTok",
  SNAPCHAT: "Snapchat",
};

function fmt(n: number) {
  return n.toLocaleString("ar-SA-u-nu-latn");
}

export default function PortalCampaignsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const { data: campaigns, isLoading } = useGetPortalCampaignsQuery(undefined, {
    skip: !clientId,
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الحملات الإعلانية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          جميع الحملات الإعلانية وأدائها.
        </p>
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">
          لم يتم ربط حسابك بملف عميل.
        </p>
      )}

      {clientId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}

          {!isLoading && campaigns && campaigns.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد حملات حالياً.</p>
              </CardContent>
            </Card>
          )}

          {!isLoading &&
            campaigns &&
            campaigns.map((campaign: PortalCampaign) => (
              <Card key={campaign.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <Badge
                      variant={STATUS_VARIANT[campaign.status] ?? "outline"}
                    >
                      {STATUS_LABELS[campaign.status] ?? campaign.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {PLATFORM_LABELS[campaign.platform] ?? campaign.platform}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">الانطباعات</p>
                      <p className="font-medium">
                        {fmt(campaign.analytics?.impressions ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">النقرات</p>
                      <p className="font-medium">
                        {fmt(campaign.analytics?.clicks ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">التحويلات</p>
                      <p className="font-medium">
                        {fmt(campaign.analytics?.conversions ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">العائد ROAS</p>
                      <p className="font-medium">
                        {campaign.analytics?.roas?.toFixed(1) ?? "0"}x
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">نسبة النقر CTR</p>
                      <p className="font-medium">
                        {campaign.analytics?.ctr?.toFixed(2) ?? "0"}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">تكلفة النقرة CPC</p>
                      <p className="font-medium">
                        {campaign.analytics?.cpc?.toFixed(2) ?? "0"} ر.س
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    الميزانية: {fmt(campaign.budgetTotal)} ر.س | المنفق:{" "}
                    {fmt(campaign.budgetSpent)} ر.س
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
