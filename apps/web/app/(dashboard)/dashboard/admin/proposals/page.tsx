"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, SendHorizonal, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminProposalsQuery,
  useGetAdminProposalStatsQuery,
} from "@/features/admin/adminProposalsApi";

const STATUS_OPTIONS = [
  { label: "مسودة", value: "DRAFT" },
  { label: "مرسل", value: "SENT" },
  { label: "قيد المراجعة", value: "UNDER_REVIEW" },
  { label: "مقبول", value: "ACCEPTED" },
  { label: "مرفوض", value: "REJECTED" },
  { label: "ملغي", value: "CANCELLED" },
];

export default function AdminProposalsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const { data, isLoading, isError } = useGetAdminProposalsQuery({
    search: search || undefined,
    status: activeFilters.status?.[0],
    page,
    limit: 20,
  });

  const { data: stats } = useGetAdminProposalStatsQuery();

  const proposals = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(
    () => [
      { label: "الإجمالي", value: stats?.total ?? 0, icon: FileText },
      { label: "مرسل", value: stats?.sent ?? 0, icon: SendHorizonal },
      { label: "مقبول", value: stats?.approved ?? 0, icon: CheckCircle },
      { label: "مرفوض", value: stats?.rejected ?? 0, icon: XCircle },
      { label: "معدل التحويل", value: stats ? `${stats.conversionRate}%` : "—", icon: TrendingUp },
    ],
    [stats],
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">عروض الأسعار</h1>
          <p className="text-muted-foreground">إدارة جميع عروض الأسعار في المنصة</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة عروض الأسعار</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-4">
            <AdminListToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="بحث بالعنوان أو اسم العميل..."
              filterGroups={[
                {
                  key: "status",
                  label: "الحالة",
                  options: STATUS_OPTIONS,
                },
              ]}
              activeFilters={activeFilters}
              onFilterChange={(key, values) =>
                setActiveFilters((prev) => ({ ...prev, [key]: values }))
              }
            />
          </div>

          {isLoading ? (
            <div className="space-y-2 px-6 pb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={FileText}
                title="حدث خطأ"
                description="حدث خطأ أثناء تحميل عروض الأسعار."
              />
            </div>
          ) : proposals.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={FileText}
                title="لا يوجد عروض أسعار"
                description="لم يتم إضافة أي عروض أسعار بعد."
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">العميل / الفرصة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المنشئ</TableHead>
                    <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/admin/proposals/${proposal.id}`}
                          className="text-primary font-medium text-sm hover:underline"
                        >
                          {proposal.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {proposal.client?.companyName ||
                          proposal.lead?.companyName ||
                          "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <AdminStatusBadge domain="proposal" status={proposal.status} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {proposal.creator?.name || "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {proposal.totalPrice.toLocaleString("ar-SA", {
                          style: "currency",
                          currency: "SAR",
                        })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(proposal.createdAt).toLocaleDateString("ar-SA")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data && data.totalPages > 1 && (
                <div className="flex justify-center py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        />
                      </PaginationItem>
                      {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={page === p}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
