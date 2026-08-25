"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, Megaphone, Search } from "lucide-react";
import { CampaignPlatform, CampaignStatus } from "@hassad/shared";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useGetCampaignsQuery,
  type MarketingCampaign,
} from "@/features/marketing/marketingApi";
import {
  CAMPAIGN_STATUS_BADGE,
  CAMPAIGN_STATUS_LABELS,
  PLATFORM_LABELS,
  computeCampaignMetrics,
} from "@/lib/utils/campaign-constants";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { projectErrorMessage } from "@/lib/i18n";

const PAGE_SIZE = 20;
const statusValues = Object.values(CampaignStatus);

type SortField =
  | "createdAt"
  | "name"
  | "startDate"
  | "budgetTotal"
  | "budgetSpent";

export default function MarketingCampaignsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "ALL">("ALL");
  const [platform, setPlatform] = useState<CampaignPlatform | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const query = useGetCampaignsQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    status: status === "ALL" ? undefined : status,
    platform: platform === "ALL" ? undefined : platform,
    sortBy,
    sortOrder: "desc",
  });

  const campaigns = query.data?.items ?? [];
  const totalPages = query.data?.totalPages ?? 0;

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changeStatus = (value: string) => {
    setStatus(value as CampaignStatus | "ALL");
    setPage(1);
  };

  const changePlatform = (value: string) => {
    setPlatform(value as CampaignPlatform | "ALL");
    setPage(1);
  };

  const changeSort = (value: string) => {
    setSortBy(value as SortField);
    setPage(1);
  };

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="الحملات التسويقية"
        description="استعرض حملاتك وتابع أدائها ومقاييسها من مكان واحد."
        icon={Megaphone}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="campaign-search"
              className="mb-1.5 block text-sm font-medium"
            >
              بحث
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="campaign-search"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="ابحث باسم الحملة أو العميل"
                className="pr-9"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <label
              htmlFor="campaign-status"
              className="mb-1.5 block text-sm font-medium"
            >
              الحالة
            </label>
            <Select value={status} onValueChange={changeStatus}>
              <SelectTrigger
                id="campaign-status"
                className="min-h-11"
                aria-label="تصفية حسب الحالة"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                {statusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CAMPAIGN_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <label
              htmlFor="campaign-platform"
              className="mb-1.5 block text-sm font-medium"
            >
              المنصة
            </label>
            <Select value={platform} onValueChange={changePlatform}>
              <SelectTrigger
                id="campaign-platform"
                className="min-h-11"
                aria-label="تصفية حسب المنصة"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل المنصات</SelectItem>
                {Object.values(CampaignPlatform).map((value) => (
                  <SelectItem key={value} value={value}>
                    {PLATFORM_LABELS[value] ?? value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <label
              htmlFor="campaign-sort"
              className="mb-1.5 block text-sm font-medium"
            >
              ترتيب حسب
            </label>
            <Select value={sortBy} onValueChange={changeSort}>
              <SelectTrigger
                id="campaign-sort"
                className="min-h-11"
                aria-label="ترتيب الحملات"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">الأحدث</SelectItem>
                <SelectItem value="name">الاسم</SelectItem>
                <SelectItem value="startDate">تاريخ البدء</SelectItem>
                <SelectItem value="budgetTotal">الميزانية</SelectItem>
                <SelectItem value="budgetSpent">الإنفاق</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </div>

      {query.isLoading ? (
        <CampaignListSkeleton />
      ) : query.isError ? (
        <Card>
          <CardContent
            className="p-4 text-center text-destructive"
            role="alert"
          >
            {projectErrorMessage(query.error)}
          </CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="لا توجد حملات"
            description={
              search || status !== "ALL" || platform !== "ALL"
                ? "جرّب تغيير البحث أو المرشح."
                : "ستظهر الحملات المسندة إليك هنا."
            }
          />
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table aria-label="قائمة الحملات التسويقية">
                <TableHeader>
                  <TableRow>
                    <TableHead>الحملة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المنصة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الميزانية</TableHead>
                    <TableHead>الإنفاق</TableHead>
                    <TableHead>البدء</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">التفاصيل</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <CampaignRow
                      key={campaign.id}
                      campaign={campaign}
                      expanded={expandedId === campaign.id}
                      onToggle={() =>
                        setExpandedId((id) =>
                          id === campaign.id ? null : campaign.id,
                        )
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {formatNumber(query.data?.total ?? 0)} حملة · صفحة {page} من{" "}
                {Math.max(totalPages, 1)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => setPage((value) => value - 1)}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={page >= totalPages || query.isFetching}
                  onClick={() => setPage((value) => value + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function CampaignRow({
  campaign,
  expanded,
  onToggle,
}: {
  campaign: MarketingCampaign;
  expanded: boolean;
  onToggle: () => void;
}) {
  const metrics = computeCampaignMetrics(campaign);
  return (
    <>
      <TableRow>
        <TableCell>
          <Link
            href={`/dashboard/marketing/campaigns/${campaign.id}`}
            className="font-medium hover:underline"
          >
            {campaign.name}
          </Link>
        </TableCell>
        <TableCell>{campaign.client?.companyName ?? "—"}</TableCell>
        <TableCell>
          {PLATFORM_LABELS[campaign.platform] ?? campaign.platform}
        </TableCell>
        <TableCell>
          <StatusBadge
            status={CAMPAIGN_STATUS_BADGE[campaign.status] ?? "DRAFT"}
            label={CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}
          />
        </TableCell>
        <TableCell>
          {formatCurrency(campaign.budgetTotal, campaign.currency)}
        </TableCell>
        <TableCell>
          {formatCurrency(campaign.budgetSpent, campaign.currency)}
        </TableCell>
        <TableCell>{formatDate(campaign.startDate)}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `إخفاء تفاصيل ${campaign.name}`
                : `عرض تفاصيل ${campaign.name}`
            }
          >
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30">
            <div
              className="grid gap-3 p-2 text-sm sm:grid-cols-4"
              aria-label={`مقاييس ${campaign.name}`}
            >
              <Metric
                label="الظهور"
                value={formatNumber(metrics.impressions)}
              />
              <Metric label="النقرات" value={formatNumber(metrics.clicks)} />
              <Metric
                label="التحويلات"
                value={formatNumber(metrics.conversions)}
              />
              <Metric
                label="ROAS"
                value={metrics.roas ? `${metrics.roas.toFixed(2)}x` : "—"}
              />
              <Metric
                label="CTR"
                value={metrics.ctr ? `${metrics.ctr.toFixed(2)}%` : "—"}
              />
              <Metric
                label="العائد"
                value={formatCurrency(metrics.revenue, campaign.currency)}
              />
              <Metric
                label="تاريخ الانتهاء"
                value={formatDate(campaign.endDate)}
              />
              <Link
                href={`/dashboard/marketing/campaigns/${campaign.id}`}
                className="flex min-h-11 items-center text-primary hover:underline"
              >
                عرض التفاصيل
              </Link>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function CampaignListSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
