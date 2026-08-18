"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Package } from "lucide-react";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useGetPortalRequestsQuery } from "@/features/portal/portalApi";
import {
  RequestRow,
  RequestsToolbar,
  type RequestsToolbarFilters,
} from "@/components/portal/requests";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  REQUEST_STATUS_GROUPS,
  type RequestStatusGroup,
} from "@/lib/utils/requestStatus";
import { portalErrorMessage } from "@/lib/i18n";

const PAGE_SIZE = 6;

function RequestsTableSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function PortalRequestsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<RequestsToolbarFilters>({
    query: "",
    statusGroups: [],
  });
  const statusValues = useMemo(
    () => filters.statusGroups.flatMap((group) => REQUEST_STATUS_GROUPS[group]),
    [filters.statusGroups],
  );
  const { data, error, isLoading, isError, refetch } =
    useGetPortalRequestsQuery(
      {
        page,
        limit: PAGE_SIZE,
        search: filters.query.trim() || undefined,
        statuses: statusValues.length ? statusValues.join(",") : undefined,
        includeCancelled: true,
      },
      { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
    );

  const requests = data?.data ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);
  const countsByGroup = useMemo(() => {
    const counts = new Map<RequestStatusGroup, number>();
    for (const [group, statuses] of Object.entries(REQUEST_STATUS_GROUPS) as [
      Exclude<RequestStatusGroup, "all">,
      readonly string[],
    ][]) {
      counts.set(
        group,
        statuses.reduce(
          (total, status) => total + (data?.statusCounts[status] ?? 0),
          0,
        ),
      );
    }
    return counts;
  }, [data?.statusCounts]);
  const view = requests;
  const hasActiveFilter =
    filters.statusGroups.length > 0 || filters.query.length > 0;
  const updateFilters = (next: RequestsToolbarFilters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        icon={ClipboardList}
        title="طلباتي"
        description="متابعة طلبات الخدمات التي قمت بتقديمها. سيتم تحويل الطلب إلى مشروع بعد توقيع العقد."
      />
      <RequestsToolbar
        value={filters}
        onChange={updateFilters}
        countsByGroup={countsByGroup}
      />
      <Card>
        {isLoading ? (
          <RequestsTableSkeleton />
        ) : isError ? (
          <CardContent className="pt-6">
            <PortalEmptyState
              icon={Package}
              title={portalErrorMessage(error)}
              description="يرجى المحاولة مرة أخرى."
              actionLabel="إعادة المحاولة"
              onAction={() => refetch()}
            />
          </CardContent>
        ) : view.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الإجراء</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الخدمات</TableHead>
                <TableHead>الشركة</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead>
                  <span className="sr-only">التفاصيل</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="pt-6">
            <PortalEmptyState
              icon={Package}
              title={
                hasActiveFilter
                  ? "لا توجد طلبات تطابق البحث"
                  : "لا توجد طلبات حالياً"
              }
              description={
                hasActiveFilter
                  ? "جرّب تغيير الفلتر أو مسح البحث لعرض جميع الطلبات."
                  : "عند إرسال طلب جديد، سيظهر هنا لمتابعة حالته حتى اكتمال التوقيع."
              }
            />
          </CardContent>
        )}
      </Card>
      {!isLoading && !isError && totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                direction="rtl"
                text="السابق"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (number) => (
                <PaginationItem key={number}>
                  <PaginationLink
                    isActive={page === number}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                direction="rtl"
                text="التالي"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </main>
  );
}
