"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useGetPortalRequestsQuery } from "@/features/portal/portalApi";
import {
  RequestRow,
  RequestsToolbar,
  type RequestsToolbarFilters,
} from "@/components/portal/requests";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { resolveStatusGroup } from "@/lib/utils/requestStatus";

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
  const { data, isLoading, isError } = useGetPortalRequestsQuery(
    { page, limit: PAGE_SIZE },
    { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );

  const requests = data?.data ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);
  const countsByGroup = useMemo(() => {
    const counts = new Map<ReturnType<typeof resolveStatusGroup>, number>();
    requests.forEach((request) => {
      const group = resolveStatusGroup(request.status);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    });
    return counts;
  }, [requests]);
  const view = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return requests.filter((request) => {
      if (
        filters.statusGroups.length &&
        !filters.statusGroups.includes(resolveStatusGroup(request.status))
      )
        return false;
      if (!query) return true;
      return [
        request.companyName,
        request.contactName,
        ...request.services.map((service) => service.nameAr ?? service.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [filters, requests]);
  const hasActiveFilter =
    filters.statusGroups.length > 0 || filters.query.length > 0;
  const updateFilters = (next: RequestsToolbarFilters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>طلباتي</CardTitle>
          <CardDescription>
            متابعة طلبات الخدمات التي قمت بتقديمها. سيتم تحويل الطلب إلى مشروع
            بعد توقيع العقد.
          </CardDescription>
        </CardHeader>
      </Card>
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
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>حدث خطأ أثناء تحميل الطلبات</EmptyTitle>
                <EmptyDescription>حاول تحديث الصفحة مرة أخرى.</EmptyDescription>
              </EmptyHeader>
            </Empty>
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
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>
                  {hasActiveFilter
                    ? "لا توجد طلبات تطابق البحث"
                    : "لا توجد طلبات حالياً"}
                </EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilter
                    ? "جرّب تغيير الفلتر أو مسح البحث لعرض جميع الطلبات."
                    : "عند إرسال طلب جديد، سيظهر هنا لمتابعة حالته حتى اكتمال التوقيع."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        )}
      </Card>
      {!isLoading && !isError && totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
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
