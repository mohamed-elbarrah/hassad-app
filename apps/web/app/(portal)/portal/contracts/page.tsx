"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useGetPortalContractsQuery } from "@/features/portal/portalApi";
import {
  ContractsToolbar,
  type DateRange,
} from "@/components/portal/contracts";
import { DomainStatusPill } from "@/components/portal/shared/DomainStatusPill";
import { Button } from "@/components/ui/button";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatShortDateLong } from "@/lib/format";

const PAGE_SIZE = 10;

export default function PortalContractsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({});
  const { data, isLoading, isError } = useGetPortalContractsQuery(
    {
      page,
      limit: PAGE_SIZE,
      search,
      dateFrom: dateRange.from?.toISOString(),
      dateTo: dateRange.to?.toISOString(),
    },
    { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );
  const contracts = data?.data ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);
  const filtered = Boolean(search || dateRange.from || dateRange.to);
  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const updateRange = (range: DateRange) => {
    setDateRange(range);
    setPage(1);
  };
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-muted-foreground" />
            <CardTitle>العقود</CardTitle>
          </div>
          <CardDescription>
            استعرض جميع عقودك الحالية، حالتها، قيمتها، وتواريخ البدء والانتهاء.
          </CardDescription>
        </CardHeader>
      </Card>
      <ContractsToolbar
        search={search}
        onSearchChange={updateSearch}
        dateRange={dateRange}
        onDateRangeChange={updateRange}
        totalCount={data?.total ?? 0}
        visibleCount={contracts.length}
      />
      <Card>
        {isLoading ? (
          <CardContent className="flex flex-col gap-3 pt-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </CardContent>
        ) : isError ? (
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>حدث خطأ أثناء تحميل العقود</EmptyTitle>
                <EmptyDescription>حاول تحديث الصفحة مرة أخرى.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : contracts.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العقد</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>الفترة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>مدير المشروع</TableHead>
                <TableHead>
                  <span className="sr-only">الإجراء</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => {
                const period =
                  [
                    formatShortDateLong(contract.startDate),
                    formatShortDateLong(contract.endDate),
                  ]
                    .filter((value) => value !== "—")
                    .join(" - ") || "—";
                const actionable = contract.status === "SENT";
                return (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.title}</p>
                        <p className="text-sm text-muted-foreground">عقد</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(contract.totalValue)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="size-3.5" />
                        {period}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DomainStatusPill
                        domain="contract"
                        status={contract.status}
                      />
                    </TableCell>
                    <TableCell>
                      {contract.projectManager ?? "غير معين"}
                    </TableCell>
                    <TableCell>
                      <Button
                        asChild
                        variant={actionable ? "default" : "outline"}
                        size="sm"
                      >
                        <Link href={`/portal/contracts/${contract.id}`}>
                          <ArrowLeft />
                          {actionable ? "توقيع العقد" : "استعراض العقد"}
                        </Link>
                      </Button>
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
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>
                  {filtered
                    ? "لا توجد نتائج مطابقة"
                    : "لا توجد عقود متاحة حالياً"}
                </EmptyTitle>
                <EmptyDescription>
                  {filtered
                    ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
                    : "ستظهر هنا العقود المرتبطة بحسابك بمجرد إنشائها."}
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
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                disabled={page === totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </main>
  );
}
