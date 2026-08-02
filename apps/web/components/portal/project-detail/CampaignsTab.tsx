"use client";

import Link from "next/link";
import { Megaphone, TrendingUp } from "lucide-react";
import {
  useGetPortalCampaignsQuery,
  type PortalCampaign,
} from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PLATFORM_LABELS } from "@/lib/utils/campaign-constants";
import { useCurrency } from "@/hooks/useCurrency";
import { EmptyState } from "./EmptyState";

function CampaignCard({
  campaign,
  fmtAmount,
}: {
  campaign: PortalCampaign;
  fmtAmount: (value: number | undefined | null) => string;
}) {
  const statusVariant =
    campaign.status === "STOPPED"
      ? "destructive"
      : campaign.status === "ACTIVE" || campaign.status === "COMPLETED"
        ? "default"
        : "secondary";
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{campaign.name}</CardTitle>
          <Badge variant={statusVariant}>{campaign.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {PLATFORM_LABELS[campaign.platform] ?? campaign.platform}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <p>
            الانطباعات:{" "}
            {campaign.analytics?.impressions?.toLocaleString(
              "ar-SA-u-nu-latn",
            ) ?? 0}
          </p>
          <p>
            النقرات:{" "}
            {campaign.analytics?.clicks?.toLocaleString("ar-SA-u-nu-latn") ?? 0}
          </p>
          <p>
            التحويلات:{" "}
            {campaign.analytics?.conversions?.toLocaleString(
              "ar-SA-u-nu-latn",
            ) ?? 0}
          </p>
          <p>العائد: {campaign.analytics?.roas?.toFixed(1) ?? "0"}x</p>
        </div>
        <p className="text-sm text-muted-foreground">
          الميزانية: {fmtAmount(campaign.budgetTotal)} | المنفق:{" "}
          {fmtAmount(campaign.budgetSpent)}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/portal/campaigns/${campaign.id}`}>عرض الحملة</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function CampaignsTab({
  projectId,
  periodId,
}: { projectId?: string; periodId?: string } = {}) {
  const { data: campaigns, isLoading } = useGetPortalCampaignsQuery(
    projectId || periodId ? { projectId, periodId } : undefined,
  );
  const { fmtAmount } = useCurrency();
  if (isLoading)
    return (
      <Card>
        <CardHeader>
          <CardTitle>الحملات</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  if (!campaigns?.length)
    return (
      <EmptyState
        icon={TrendingUp}
        title="لا توجد حملات لهذه الفترة"
        description="ستظهر الحملات المرتبطة بالمشروع هنا فور إطلاقها."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone />
          الحملات
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            fmtAmount={fmtAmount}
          />
        ))}
      </CardContent>
    </Card>
  );
}
