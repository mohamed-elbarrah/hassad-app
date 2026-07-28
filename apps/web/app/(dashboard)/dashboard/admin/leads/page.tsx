"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp, Download, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminLeadsQuery,
  useGetAdminLeadStatsQuery,
} from "@/features/admin/adminLeadsApi";
import {
  LEAD_STAGE_AR,
  CLIENT_SOURCE_AR,
  BUSINESS_TYPE_AR,
} from "@hassad/shared";

export default function AdminLeadsPage() {
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
    if (activeFilters.stage?.length) f.stage = activeFilters.stage[0];
    if (activeFilters.source?.length) f.source = activeFilters.source[0];
    if (activeFilters.businessType?.length)
      f.businessType = activeFilters.businessType[0];
    return f;
  }, [search, page, activeFilters]);

  const { data, isLoading, isError } = useGetAdminLeadsQuery(filters as any);
  const { data: stats } = useGetAdminLeadStatsQuery();

  const leads = useMemo(() => data?.items ?? [], [data]);

  const newCount = useMemo(
    () => stats?.byStage?.find((s) => s.stage === "NEW")?.count ?? 0,
    [stats],
  );

  const statCards = [
    { label: "الإجمالي", value: data?.total ?? 0 },
    { label: "جديد", value: newCount },
    {
      label: "معدل التحويل",
      value:
        stats?.conversionRate != null
          ? `${(stats.conversionRate * 100).toFixed(1)}%`
          : "—",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">العملاء المتوقعون</h1>
          <p className="text-muted-foreground">إدارة جميع العملاء المتوقعين وفرص البيع</p>
        </div>
        <Button>
          <UserPlus className="size-4" />
          إضافة عميل متوقع
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة العملاء المتوقعين</CardTitle>
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
              searchPlaceholder="بحث بالشركة أو جهة الاتصال..."
              filterGroups={[
                {
                  key: "stage",
                  label: "المرحلة",
                  options: Object.entries(LEAD_STAGE_AR).map(
                    ([value, label]) => ({ label, value }),
                  ),
                },
                {
                  key: "source",
                  label: "المصدر",
                  options: Object.entries(CLIENT_SOURCE_AR).map(
                    ([value, label]) => ({ label, value }),
                  ),
                },
                {
                  key: "businessType",
                  label: "نوع النشاط",
                  options: Object.entries(BUSINESS_TYPE_AR).map(
                    ([value, label]) => ({ label, value }),
                  ),
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
                icon={TrendingUp}
                title="حدث خطأ"
                description="حدث خطأ أثناء تحميل العملاء المتوقعين."
              />
            </div>
          ) : leads.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={TrendingUp}
                title="لا يوجد عملاء متوقعون"
                description="لم يتم إضافة أي عملاء متوقعين بعد."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الشركة</TableHead>
                  <TableHead className="text-right">جهة الاتصال</TableHead>
                  <TableHead className="text-right">المرحلة</TableHead>
                  <TableHead className="text-right">المصدر</TableHead>
                  <TableHead className="text-right">المسؤول</TableHead>
                  <TableHead className="text-right">آخر تواصل</TableHead>
                  <TableHead className="text-center">القيمة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead: any) => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/admin/leads/${lead.id}`}
                        className="text-primary font-medium text-sm hover:underline"
                      >
                        {lead.companyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {lead.contactName}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminStatusBadge domain="lead" status={lead.pipelineStage} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {CLIENT_SOURCE_AR[
                        lead.source as keyof typeof CLIENT_SOURCE_AR
                      ] || lead.source}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {lead.assigneeName || "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {lead.lastContactAt
                        ? new Date(lead.lastContactAt).toLocaleDateString("ar-SA")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {lead.potentialValue != null
                        ? `${lead.potentialValue.toLocaleString()} ر.س`
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
