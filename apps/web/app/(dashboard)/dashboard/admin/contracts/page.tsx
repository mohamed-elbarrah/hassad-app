"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";

import { useGetAdminContractsQuery } from "@/features/admin/adminContractsApi";

const CONTRACT_TYPE_AR: Record<string, string> = {
  MONTHLY_RETAINER: "اشتراك شهري",
  FIXED_PROJECT: "مشروع ثابت",
  ONE_TIME_SERVICE: "خدمة لمرة واحدة",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function AdminContractsPage() {
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const statusFilter = activeFilters.status?.[0];
  const typeFilter = activeFilters.type?.[0];

  const { data, isLoading, isError } = useGetAdminContractsQuery({
    search: search || undefined,
    status: statusFilter,
    type: typeFilter,
    page,
    limit: 20,
  });

  const contracts = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const active = contracts.filter((c) => c.status === "ACTIVE").length;
    const draft = contracts.filter((c) => c.status === "DRAFT").length;
    return { total, active, draft };
  }, [data, contracts]);

  const cards = [
    { label: "الإجمالي", value: statCards.total },
    { label: "نشط", value: statCards.active },
    { label: "مسودة", value: statCards.draft },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">العقود</h1>
          <p className="text-muted-foreground">إدارة جميع عقود المنصة: العقود النشطة والمسودات</p>
        </div>
        <Button>
          <Plus className="size-4" />
          إضافة عقد
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
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
          <CardTitle>قائمة العقود</CardTitle>
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
              searchPlaceholder="بحث بالعنوان أو اسم العميل..."
              filterGroups={[
                {
                  key: "status",
                  label: "الحالة",
                  options: [
                    { label: "مسودة", value: "DRAFT" },
                    { label: "مرسل", value: "SENT" },
                    { label: "موقّع", value: "SIGNED" },
                    { label: "نشط", value: "ACTIVE" },
                    { label: "معلق", value: "ON_HOLD" },
                    { label: "مكتمل", value: "COMPLETED" },
                    { label: "منتهي", value: "EXPIRED" },
                    { label: "ملغي", value: "CANCELLED" },
                  ],
                },
                {
                  key: "type",
                  label: "النوع",
                  options: [
                    { label: "اشتراك شهري", value: "MONTHLY_RETAINER" },
                    { label: "مشروع ثابت", value: "FIXED_PROJECT" },
                    { label: "خدمة لمرة واحدة", value: "ONE_TIME_SERVICE" },
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
                icon={FileText}
                title="حدث خطأ"
                description="حدث خطأ أثناء تحميل العقود."
              />
            </div>
          ) : contracts.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={FileText}
                title="لا يوجد عقود"
                description="لم يتم إضافة أي عقود بعد."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">القيمة الشهرية</TableHead>
                  <TableHead className="text-right">القيمة الإجمالية</TableHead>
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/admin/contracts/${contract.id}`}
                        className="text-primary font-medium text-sm hover:underline"
                      >
                        {contract.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {contract.clientName}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {CONTRACT_TYPE_AR[contract.type] || contract.type}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminStatusBadge domain="contract" status={contract.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {contract.monthlyValue > 0
                        ? formatCurrency(contract.monthlyValue)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(contract.totalValue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {contract.startDate
                        ? new Date(contract.startDate).toLocaleDateString("ar-SA")
                        : "—"}
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
