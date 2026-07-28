"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";

import { useGetAdminRequestsQuery } from "@/features/admin/adminRequestsApi";

export default function AdminRequestsPage() {
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const filters = useMemo(() => {
    const f: Record<string, string | number | undefined> = {
      search: search || undefined,
      page,
      limit: 20,
    };
    if (activeFilters.status?.length) f.status = activeFilters.status[0];
    return f as any;
  }, [search, page, activeFilters]);

  const { data, isLoading, isError } = useGetAdminRequestsQuery(filters);

  const requests = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const pending = requests.filter((r) =>
      [
        "SUBMITTED",
        "QUALIFYING",
        "PROPOSAL_IN_PROGRESS",
        "PROPOSAL_SENT",
        "NEGOTIATION",
        "CONTRACT_PREPARATION",
        "CONTRACT_SENT",
      ].includes(r.status),
    ).length;
    const completed = requests.filter((r) =>
      ["SIGNED", "PROJECT_CREATED"].includes(r.status),
    ).length;
    return { total, pending, completed };
  }, [data, requests]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الطلبات</h1>
          <p className="text-muted-foreground">إدارة طلبات العملاء الجديدة وطلبات الخدمات</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "الإجمالي", value: statCards.total },
          { label: "قيد التنفيذ", value: statCards.pending },
          { label: "مكتمل", value: statCards.completed },
        ].map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الطلبات</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="size-4" />
            تصدير CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-4">
            <AdminListToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="بحث باسم العميل..."
              filterGroups={[
                {
                  key: "status",
                  label: "الحالة",
                  options: [
                    { label: "مقدم", value: "SUBMITTED" },
                    { label: "قيد التأهيل", value: "QUALIFYING" },
                    { label: "إعداد العرض", value: "PROPOSAL_IN_PROGRESS" },
                    { label: "أرسل العرض", value: "PROPOSAL_SENT" },
                    { label: "تفاوض", value: "NEGOTIATION" },
                    { label: "إعداد العقد", value: "CONTRACT_PREPARATION" },
                    { label: "أرسل العقد", value: "CONTRACT_SENT" },
                    { label: "موقّع", value: "SIGNED" },
                    { label: "تم إنشاء المشروع", value: "PROJECT_CREATED" },
                    { label: "ملغي", value: "CANCELLED" },
                  ],
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
                icon={ClipboardList}
                title="حدث خطأ"
                description="حدث خطأ أثناء تحميل الطلبات."
              />
            </div>
          ) : requests.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={ClipboardList}
                title="لا يوجد طلبات"
                description="لم يتم تقديم أي طلبات بعد."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم العميل</TableHead>
                  <TableHead className="text-right">المسؤول</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">الخدمات</TableHead>
                  <TableHead className="text-center">العمر (أيام)</TableHead>
                  <TableHead className="text-right">تاريخ الطلب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/admin/requests/${request.id}`}
                        className="text-primary font-medium text-sm hover:underline"
                      >
                        {request.clientName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {request.assigneeName || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminStatusBadge domain="request" status={request.status} />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {request.servicesCount}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {request.ageDays}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString("ar-SA")}
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
