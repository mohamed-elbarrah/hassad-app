"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Calendar, DollarSign } from "lucide-react";
import {
  useGetPortalCampaignQuery,
  type PortalCampaignDetail,
} from "@/features/portal/portalApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PortalCampaignDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: campaign, isLoading, isError, refetch } = useGetPortalCampaignQuery(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <Skeleton className="h-6 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/portal/campaigns">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            الحملات الإعلانية
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-sm">
              {isError
                ? "تعذر تحميل بيانات الحملة. يرجى المحاولة مرة أخرى."
                : "الحملة غير موجودة."}
            </p>
            {isError && (
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                إعادة المحاولة
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const campaignData = campaign as PortalCampaignDetail;
  const snapshots = campaignData.kpiSnapshots ?? [];
  const chronologicalSnapshots = [...snapshots].reverse();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center gap-2">
        <Link href="/portal/campaigns">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            الحملات الإعلانية
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium truncate max-w-xs">
          {campaignData.name}
        </span>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl">{campaignData.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {PLATFORM_LABELS[campaignData.platform] ?? campaignData.platform}
                {" · "}
                {formatDate(campaignData.startDate)}
                {campaignData.endDate
                  ? ` — ${formatDate(campaignData.endDate)}`
                  : ""}
              </p>
            </div>
            <Badge
              variant={STATUS_VARIANT[campaignData.status] ?? "outline"}
            >
              {STATUS_LABELS[campaignData.status] ?? campaignData.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border bg-muted/20">
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">الميزانية الكلية</p>
                  <p className="text-lg font-semibold">
                    {fmt(campaignData.budgetTotal)} ر.س
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border bg-muted/20">
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">الميزانية المنفقة</p>
                  <p className="text-lg font-semibold">
                    {fmt(campaignData.budgetSpent)} ر.س
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border bg-muted/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ البدء</p>
                  <p className="text-lg font-semibold">
                    {formatDate(campaignData.startDate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">أداء الحملة الحالي</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <AnalyticsItem label="الانطباعات" value={fmt(campaignData.analytics?.impressions ?? 0)} />
              <AnalyticsItem label="النقرات" value={fmt(campaignData.analytics?.clicks ?? 0)} />
              <AnalyticsItem label="التحويلات" value={fmt(campaignData.analytics?.conversions ?? 0)} />
              <AnalyticsItem label="العائد ROAS" value={`${campaignData.analytics?.roas?.toFixed(1) ?? "0"}x`} />
              <AnalyticsItem label="نسبة النقر CTR" value={`${campaignData.analytics?.ctr?.toFixed(2) ?? "0"}%`} />
              <AnalyticsItem label="تكلفة النقرة CPC" value={`${campaignData.analytics?.cpc?.toFixed(2) ?? "0"} ر.س`} />
              <AnalyticsItem label="تكلفة التحويل CPA" value={`${campaignData.analytics?.cpa?.toFixed(2) ?? "0"} ر.س`} />
              <AnalyticsItem label="الإيرادات" value={`${fmt(campaignData.analytics?.revenue ?? 0)} ر.س`} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">حالة الحملة</h3>
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    campaignData.status === "ACTIVE"
                      ? "bg-emerald-500"
                      : campaignData.status === "COMPLETED"
                        ? "bg-blue-500"
                        : campaignData.status === "PAUSED" || campaignData.status === "STOPPED"
                          ? "bg-orange-500"
                          : "bg-gray-400"
                  }`} />
                  <div>
                    <p className="text-sm font-medium">
                      {STATUS_LABELS[campaignData.status] ?? campaignData.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      آخر تحديث: {formatDate(campaignData.updatedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل مؤشرات الأداء</CardTitle>
          <p className="text-sm text-muted-foreground">
            جميع قياسات الأداء المسجلة مرتبة من الأقدم إلى الأحدث
          </p>
        </CardHeader>
        <CardContent>
          {chronologicalSnapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              لا توجد قياسات أداء مسجلة لهذه الحملة حتى الآن.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 px-3 font-medium">التاريخ</th>
                    <th className="py-2 px-3 font-medium">الانطباعات</th>
                    <th className="py-2 px-3 font-medium">النقرات</th>
                    <th className="py-2 px-3 font-medium">التحويلات</th>
                    <th className="py-2 px-3 font-medium">CTR</th>
                    <th className="py-2 px-3 font-medium">CPC</th>
                    <th className="py-2 px-3 font-medium">ROAS</th>
                    <th className="py-2 px-3 font-medium">المصدر</th>
                  </tr>
                </thead>
                <tbody>
                  {chronologicalSnapshots.map((snap) => (
                    <tr key={snap.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3 whitespace-nowrap">
                        {formatDate(snap.recordedAt)}
                      </td>
                      <td className="py-2 px-3">{fmt(snap.impressions)}</td>
                      <td className="py-2 px-3">{fmt(snap.clicks)}</td>
                      <td className="py-2 px-3">{fmt(snap.conversions)}</td>
                      <td className="py-2 px-3">{snap.ctr.toFixed(2)}%</td>
                      <td className="py-2 px-3">{snap.cpc.toFixed(2)} ر.س</td>
                      <td className="py-2 px-3">{snap.roas.toFixed(1)}x</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">
                        {snap.source ?? "يدوي"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/10 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  );
}
