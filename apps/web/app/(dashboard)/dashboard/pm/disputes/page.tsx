"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { DISPUTE_PRIORITY_AR, type DisputeStatus } from "@hassad/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisputeEmptyState } from "@/components/disputes/DisputeEmptyState";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import {
  useGetPmDisputesQuery,
  useGetPmDisputeStatsQuery,
} from "@/features/disputes/pmDisputesApi";
import { PageHeader } from "@/components/common/PageHeader";
import { formatShortDate } from "@/lib/format";
import { pmErrorMessage } from "@/lib/i18n";

const PAGE_SIZE = 12;
const TABS = [
  { value: "", label: "الكل" },
  { value: "APPROVED", label: "جديدة" },
  { value: "IN_PROGRESS", label: "قيد المعالجة" },
  { value: "ESCALATED", label: "مصعدة" },
  { value: "RESOLVED", label: "تم حلها" },
] as const;

export default function PmDisputesPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetPmDisputesQuery(
      {
        status: (activeTab || undefined) as DisputeStatus | undefined,
        search: search.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      },
      { pollingInterval: 60_000 },
    );
  const {
    data: stats,
    isError: isStatsError,
    refetch: refetchStats,
  } = useGetPmDisputeStatsQuery(undefined, {
    pollingInterval: 60_000,
  });
  const disputes = data?.data ?? [];
  const metrics = {
    active: stats?.active ?? 0,
    escalated: stats?.escalated ?? 0,
    resolved: stats?.resolved ?? 0,
  };
  const totalPages = data?.meta.totalPages ?? 1;
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="نزاعاتي"
        description="راقب التذاكر المفتوحة ضد مشاريعك وتعامل معها من مساحة موحدة."
        icon={ShieldAlert}
      />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "نشطة", value: metrics.active, icon: Clock3 },
          { label: "مصعدة", value: metrics.escalated, icon: AlertTriangle },
          {
            label: "تم حلها / مغلقة",
            value: metrics.resolved,
            icon: CheckCircle2,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-2xl font-semibold">
                  {isStatsError ? "—" : item.value}
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <item.icon aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      {isStatsError ? (
        <Alert>
          <AlertTitle>تعذر تحميل مؤشرات النزاعات</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              إعادة المحاولة
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3 border-b pb-6 lg:flex-row lg:items-center">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="ابحث في النزاعات..."
          aria-label="البحث في النزاعات"
          className="w-full lg:max-w-sm"
        />
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            setPage(1);
          }}
          aria-label="تصفية النزاعات حسب الحالة"
          className="lg:mr-auto"
        >
          <TabsList className="h-auto flex-wrap">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw aria-hidden="true" data-icon="inline-start" />
          {isFetching ? "جارٍ التحديث" : "تحديث"}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <DisputesTableSkeleton />
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTitle>تعذر تحميل النزاعات</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              {pmErrorMessage(error)}
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => refetch()}
              >
                إعادة المحاولة
              </Button>
            </AlertDescription>
          </Alert>
        ) : disputes.length === 0 ? (
          <DisputeEmptyState
            hasFilter={!!search || !!activeTab}
            canCreate={false}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <caption className="sr-only">قائمة النزاعات</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>النزاع</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الفتح</TableHead>
                  <TableHead className="text-left">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          #{dispute.ticketNumber} {dispute.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dispute._count?.messages || 0} رسائل
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dispute.client.companyName ??
                        dispute.client.user?.name ??
                        "-"}
                    </TableCell>
                    <TableCell>{dispute.project.name}</TableCell>
                    <TableCell>
                      <PmStatusBadge domain="dispute" status={dispute.status} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dispute.priority === "URGENT"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {DISPUTE_PRIORITY_AR[dispute.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell dir="ltr">
                      {formatShortDate(dispute.openedAt)}
                    </TableCell>
                    <TableCell className="text-left">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/dashboard/pm/disputes/${dispute.id}`}>
                          <ArrowUpRight
                            aria-hidden="true"
                            data-icon="inline-start"
                          />
                          فتح
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!isError && disputes.length > 0 && (
          <DisputePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </main>
  );
}

function DisputesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 7 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, row) => (
            <TableRow key={row}>
              {Array.from({ length: 7 }).map((_, cell) => (
                <TableCell key={cell}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DisputePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text="السابق"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (item) => (
            <PaginationItem key={item}>
              <PaginationLink
                isActive={item === page}
                onClick={() => onPageChange(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            text="التالي"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
