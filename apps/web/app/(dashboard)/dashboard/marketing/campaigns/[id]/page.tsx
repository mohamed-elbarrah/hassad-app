"use client";

import { use } from "react";
import {
  useGetCampaignByIdQuery,
  useGetCampaignKpisQuery,
} from "@/features/campaigns/campaignsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: campaign, isLoading: campaignLoading } = useGetCampaignByIdQuery(id);
  const { data: kpis, isLoading: kpisLoading } = useGetCampaignKpisQuery(id);

  const totals = kpis?.reduce(
    (acc, k) => ({
      impressions: acc.impressions + (k.impressions ?? 0),
      clicks: acc.clicks + (k.clicks ?? 0),
      messagesReceived: acc.messagesReceived + (k.messagesReceived ?? 0),
      ordersCount: acc.ordersCount + (k.ordersCount ?? 0),
    }),
    { impressions: 0, clicks: 0, messagesReceived: 0, ordersCount: 0 },
  );

  const KPI_CARDS = [
    { label: "الميزانية الإجمالية", value: campaignLoading ? null : `${fmt(campaign?.budgetTotal)} دج` },
    { label: "المنفق", value: campaignLoading ? null : `${fmt(campaign?.budgetSpent)} دج` },
    { label: "الظهور", value: kpisLoading ? null : fmt(totals?.impressions) },
    { label: "النقرات", value: kpisLoading ? null : fmt(totals?.clicks) },
    { label: "الرسائل", value: kpisLoading ? null : fmt(totals?.messagesReceived) },
    { label: "الطلبات", value: kpisLoading ? null : fmt(totals?.ordersCount) },
  ];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        {campaignLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <h1 className="text-2xl font-semibold">{campaign?.name ?? "الحملة"}</h1>
        )}
        <div className="flex items-center gap-2 mt-1">
          {campaignLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <>
              <span className="text-sm text-muted-foreground">
                {campaign?.client?.companyName ?? "—"} ·{" "}
                {PLATFORM_LABELS[campaign?.platform ?? ""] ?? campaign?.platform}
              </span>
              <Badge variant="secondary">
                {STATUS_LABELS[campaign?.status ?? ""] ?? campaign?.status}
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {KPI_CARDS.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.value == null ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-xl font-semibold" dir="ltr">{item.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل اللقطات</CardTitle>
        </CardHeader>
        <CardContent>
          {kpisLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {!kpisLoading && kpis && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الظهور</TableHead>
                  <TableHead className="text-right">النقرات</TableHead>
                  <TableHead className="text-right">الرسائل</TableHead>
                  <TableHead className="text-right">الطلبات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      لا توجد لقطات أداء بعد.
                    </TableCell>
                  </TableRow>
                )}
                {kpis.map((kpi) => (
                  <TableRow key={kpi.id}>
                    <TableCell dir="ltr">
                      {new Date(kpi.snapshotDate).toLocaleDateString("ar-DZ")}
                    </TableCell>
                    <TableCell>{fmt(kpi.impressions)}</TableCell>
                    <TableCell>{fmt(kpi.clicks)}</TableCell>
                    <TableCell>{fmt(kpi.messagesReceived)}</TableCell>
                    <TableCell>{fmt(kpi.ordersCount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
