"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Scale, MessageSquareWarning, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";

import {
  useGetAdminDisputesQuery,
  useGetAdminDisputeStatsQuery,
} from "@/features/admin/adminDisputesApi";
import { DISPUTE_PRIORITY_AR } from "@hassad/shared";

const CATEGORY_OPTIONS = [
  { label: "تأخير", value: "DELAY" },
  { label: "جودة", value: "QUALITY" },
  { label: "تواصل", value: "COMMUNICATION" },
  { label: "ميزانية", value: "BUDGET" },
  { label: "نطاق العمل", value: "SCOPE" },
  { label: "تعامل", value: "ATTITUDE" },
  { label: "أخرى", value: "OTHER" },
];

const STATUS_OPTIONS = [
  { label: "بانتظار الموافقة", value: "PENDING_APPROVAL" },
  { label: "مرفوض", value: "REJECTED" },
  { label: "تمت الموافقة", value: "APPROVED" },
  { label: "قيد المعالجة", value: "IN_PROGRESS" },
  { label: "بانتظار تأكيد العميل", value: "PENDING_CLIENT" },
  { label: "تم التصعيد", value: "ESCALATED" },
  { label: "تم الحل", value: "RESOLVED" },
  { label: "مغلق", value: "CLOSED" },
];

const PRIORITY_OPTIONS = [
  { label: "منخفض", value: "LOW" },
  { label: "عادي", value: "NORMAL" },
  { label: "عالي", value: "HIGH" },
  { label: "عاجل", value: "URGENT" },
];

function getPriorityVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "secondary";
    case "NORMAL":
      return "default";
    case "LOW":
      return "outline";
    default:
      return "outline";
  }
}

export default function AdminDisputesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const filterStatus = activeFilters.status?.[0];
  const filterCategory = activeFilters.category?.[0];
  const filterPriority = activeFilters.priority?.[0];

  const { data, isLoading, isError } = useGetAdminDisputesQuery({
    status: filterStatus,
    category: filterCategory,
    priority: filterPriority,
    page,
    limit: 20,
  });

  const { data: stats, isLoading: statsLoading } =
    useGetAdminDisputeStatsQuery();

  const disputes = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "بانتظار الموافقة", value: stats.pendingApproval },
      { label: "نشط", value: stats.active },
      { label: "مصعّد", value: stats.escalated },
      { label: "محلول", value: stats.resolved },
      { label: "مغلق", value: stats.closed },
    ];
  }, [stats]);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">النزاعات</h1>
        <p className="text-muted-foreground">إدارة نزاعات العملاء ومشاكل المشاريع</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold mt-2">
              {statsLoading ? "—" : card.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة النزاعات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-4">
            <AdminListToolbar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="بحث برقم التذكرة أو العنوان..."
              filterGroups={[
                {
                  key: "status",
                  label: "الحالة",
                  options: STATUS_OPTIONS,
                },
                {
                  key: "category",
                  label: "التصنيف",
                  options: CATEGORY_OPTIONS,
                },
                {
                  key: "priority",
                  label: "الأولوية",
                  options: PRIORITY_OPTIONS,
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
                icon={Scale}
                title="حدث خطأ"
                description="حدث خطأ أثناء تحميل النزاعات."
              />
            </div>
          ) : disputes.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={Scale}
                title="لا يوجد نزاعات"
                description="لم يتم تسجيل أي نزاعات حتى الآن."
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم التذكرة</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">المشروع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الأولوية</TableHead>
                    <TableHead className="text-right">مدير المشروع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/admin/disputes/${dispute.id}`}
                          className="text-primary font-medium text-sm hover:underline"
                        >
                          #{dispute.ticketNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/admin/disputes/${dispute.id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {dispute.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {dispute.client.companyName}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {dispute.project.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <AdminStatusBadge domain="dispute" status={dispute.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getPriorityVariant(dispute.priority)}>
                          {DISPUTE_PRIORITY_AR[
                            dispute.priority as keyof typeof DISPUTE_PRIORITY_AR
                          ] || dispute.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {dispute.pm.name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!isLoading && !isError && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4">
                  <p className="text-sm text-muted-foreground">إجمالي {total} نزاع</p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
