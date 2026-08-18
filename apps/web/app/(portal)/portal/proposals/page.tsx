"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useGetMyPortalProposalsQuery } from "@/features/portal/portalApi";
import { ProposalsToolbar } from "@/components/portal/proposals";
import { DomainStatusPill } from "@/components/portal/shared/DomainStatusPill";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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

export default function PortalProposalsPage() {
  const {
    data: proposals,
    isLoading,
    isError,
  } = useGetMyPortalProposalsQuery(undefined, {
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (proposals ?? []).filter(
      (proposal) =>
        (!activeFilters.status?.length ||
          activeFilters.status.includes(proposal.status)) &&
        (!query ||
          proposal.title.toLowerCase().includes(query) ||
          proposal.lead?.companyName?.toLowerCase().includes(query) ||
          proposal.request?.companyName?.toLowerCase().includes(query)),
    );
  }, [activeFilters, proposals, search]);
  const active = Boolean(search || activeFilters.status?.length);
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="العروض الفنية"
        description="استعرض العروض الفنية المقدمة لك وراجع تفاصيلها قبل الموافقة."
        icon={FileText}
      />
      <ProposalsToolbar
        search={search}
        onSearchChange={setSearch}
        activeFilters={activeFilters}
        onFilterChange={(key, values) =>
          setActiveFilters((current) => ({ ...current, [key]: values }))
        }
        proposals={proposals}
        totalCount={proposals?.length ?? 0}
        visibleCount={filtered.length}
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
                <EmptyTitle>حدث خطأ أثناء تحميل العروض</EmptyTitle>
                <EmptyDescription>حاول تحديث الصفحة مرة أخرى.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : filtered.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عنوان العرض</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>تاريخ الإرسال</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>
                  <span className="sr-only">الإجراء</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((proposal) => {
                const href = proposal.shareLinkToken
                  ? `/portal/proposals/${proposal.shareLinkToken}`
                  : null;
                return (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <p className="font-medium">{proposal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {proposal.lead?.companyName ??
                          proposal.request?.companyName ??
                          "—"}
                      </p>
                    </TableCell>
                    <TableCell>{formatCurrency(proposal.totalPrice)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="size-3.5" />
                        {formatShortDateLong(
                          proposal.sentAt ?? proposal.createdAt,
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DomainStatusPill
                        domain="proposal"
                        status={proposal.status}
                      />
                    </TableCell>
                    <TableCell>
                      {href ? (
                        <Button
                          asChild
                          variant={
                            proposal.status === "SENT" ? "default" : "outline"
                          }
                          size="sm"
                        >
                          <Link href={href}>
                            <ArrowLeft />
                            {proposal.status === "SENT"
                              ? "مراجعة العرض"
                              : "فتح العرض"}
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">غير متاح</span>
                      )}
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
                  {active
                    ? "لا توجد نتائج مطابقة"
                    : "لا توجد عروض فنية حتى الآن"}
                </EmptyTitle>
                <EmptyDescription>
                  {active
                    ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
                    : "ستظهر هنا العروض الفنية المقدمة لك فور إعدادها."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
