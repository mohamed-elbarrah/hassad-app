"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGetCampaignsQuery } from "@/features/campaigns/campaignsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "تخطيط",
  ACTIVE: "نشطة",
  PAUSED: "متوقفة",
  COMPLETED: "منتهية",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PLANNING: "outline",
  ACTIVE: "default",
  PAUSED: "secondary",
  COMPLETED: "secondary",
};

const PLATFORM_LABELS: Record<string, string> = {
  META: "Meta",
  GOOGLE: "Google",
  SNAPCHAT: "Snapchat",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
};

export default function MarketingCampaignsPage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? undefined;

  const { data, isLoading, isError } = useGetCampaignsQuery({
    clientId,
    limit: 30,
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الحملات</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {clientId ? "الحملات الخاصة بهذا العميل." : "جميع الحملات الإعلانية."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            قائمة الحملات
            {data && (
              <span className="text-muted-foreground font-normal text-sm mr-2">
                ({data.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">حدث خطأ أثناء تحميل الحملات.</p>
          )}
          {!isLoading && !isError && data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الحملة</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">المنصة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الميزانية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      لا توجد حملات.
                    </TableCell>
                  </TableRow>
                )}
                {data.items.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/marketing/campaigns/${campaign.id}`}
                        className="hover:underline text-primary"
                      >
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.client?.companyName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {PLATFORM_LABELS[campaign.platform] ?? campaign.platform}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[campaign.status] ?? "outline"}>
                        {STATUS_LABELS[campaign.status] ?? campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell dir="ltr">
                      {campaign.budgetTotal.toLocaleString("ar-DZ")} دج
                    </TableCell>
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
