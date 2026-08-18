"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Search, TrendingUp, X } from "lucide-react";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { PageHeader } from "@/components/common/PageHeader";
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";
import { useAppSelector } from "@/lib/hooks";
import { useGetPortalCampaignsQuery } from "@/features/portal/portalApi";
import { DomainStatusPill } from "@/components/portal/shared/DomainStatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  budgetProgress,
  formatCurrency,
  formatShortDateLong,
} from "@/lib/format";
import { portalErrorMessage } from "@/lib/i18n";

export default function PortalCampaignsPage() {
  const clientId = useAppSelector((state) => state.auth.user?.clientId ?? "");
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const {
    data: campaigns,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPortalCampaignsQuery(undefined, {
    skip: !clientId,
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (campaigns ?? []).filter(
      (campaign) =>
        (!statuses.length || statuses.includes(campaign.status)) &&
        (!q ||
          campaign.name.toLowerCase().includes(q) ||
          campaign.platform.toLowerCase().includes(q)),
    );
  }, [campaigns, search, statuses]);
  const options = [
    ...new Set((campaigns ?? []).map((campaign) => campaign.status)),
  ];
  const toggle = (status: string) =>
    setStatuses((current) =>
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status],
    );
  if (!clientId)
    return (
      <main dir="rtl">
        <Card>
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TrendingUp />
                </EmptyMedia>
                <EmptyTitle>حساب العميل غير مرتبط</EmptyTitle>
                <EmptyDescription>
                  يرجى التواصل مع الإدارة لربط الحساب بملف العميل.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </main>
    );
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="الحملات الإعلانية"
        description="جميع الحملات الإعلانية المرتبطة بحسابك مع مؤشرات الأداء الرئيسية."
        icon={TrendingUp}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9 pe-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم الحملة أو المنصة..."
          />
          {search ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-1 top-1/2 size-8 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X />
            </Button>
          ) : null}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter />
              الحالة
              {statuses.length ? (
                <Badge variant="secondary">{statuses.length}</Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            collisionPadding={16}
            className="flex w-max max-w-[calc(100vw-2rem)] flex-col gap-3 p-4"
            dir="rtl"
          >
            <div>
              <p className="font-medium">حالة الحملة</p>
              <p className="text-sm text-muted-foreground">اختر حالة واحدة.</p>
            </div>
            <Separator />
            {options.map((status) => {
              const id = `campaign-status-${status}`;
              const selected = statuses.includes(status);
              return (
                <Label
                  key={status}
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Checkbox
                    id={id}
                    checked={selected}
                    onCheckedChange={() => toggle(status)}
                  />
                  {status}
                </Label>
              );
            })}
            {statuses.length ? (
              <Button variant="ghost" size="sm" onClick={() => setStatuses([])}>
                مسح الفلاتر
              </Button>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>
      <Card>
        {isLoading ? (
          <CardContent className="flex flex-col gap-3 pt-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </CardContent>
        ) : isError ? (
          <CardContent className="pt-6">
            <PortalEmptyState
              icon={TrendingUp}
              title={portalErrorMessage(error)}
              description="يرجى المحاولة مرة أخرى."
              actionLabel="إعادة المحاولة"
              onAction={() => refetch()}
            />
          </CardContent>
        ) : filtered.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الحملة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الفترة</TableHead>
                <TableHead>الانطباعات</TableHead>
                <TableHead>النقرات</TableHead>
                <TableHead>التحويلات</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>ROAS</TableHead>
                <TableHead>الميزانية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((campaign) => {
                const analytics = campaign.analytics;
                const pct =
                  budgetProgress(campaign.budgetSpent, campaign.budgetTotal) *
                  100;
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Button asChild variant="link" className="h-auto p-0">
                        <Link href={`/portal/campaigns/${campaign.id}`}>
                          {campaign.name}
                        </Link>
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        {campaign.platform}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DomainStatusPill
                        domain="campaign"
                        status={campaign.status}
                      />
                    </TableCell>
                    <TableCell>
                      {formatShortDateLong(campaign.startDate)} -{" "}
                      {formatShortDateLong(campaign.endDate)}
                    </TableCell>
                    <TableCell>
                      {analytics.impressions.toLocaleString("ar-SA-u-nu-latn")}
                    </TableCell>
                    <TableCell>
                      {analytics.clicks.toLocaleString("ar-SA-u-nu-latn")}
                    </TableCell>
                    <TableCell>
                      {analytics.conversions.toLocaleString("ar-SA-u-nu-latn")}
                    </TableCell>
                    <TableCell>
                      {analytics.ctr ? `${analytics.ctr.toFixed(2)}%` : "—"}
                    </TableCell>
                    <TableCell>
                      {analytics.roas ? `${analytics.roas.toFixed(2)}x` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-32">
                        <p className="text-sm">
                          {formatCurrency(campaign.budgetSpent)} /{" "}
                          {formatCurrency(campaign.budgetTotal)}
                        </p>
                        <Progress value={pct} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TrendingUp />
                </EmptyMedia>
                <EmptyTitle>لا توجد حملات مطابقة</EmptyTitle>
                <EmptyDescription>
                  جرّب تغيير البحث أو الفلاتر.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
