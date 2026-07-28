"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";

import { useGetAdminProjectsQuery } from "@/features/admin/adminProjectsApi";
import { cn } from "@/lib/utils";

export default function AdminProjectsPage() {
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const { data, isLoading, isError } = useGetAdminProjectsQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  const projects = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const active = projects.filter((p) => p.status === "ACTIVE").length;
    const onHold = projects.filter((p) => p.status === "ON_HOLD").length;
    const completed = projects.filter((p) => p.status === "COMPLETED").length;
    return { total, active, onHold, completed };
  }, [data, projects]);

  const cards = [
    { label: "الإجمالي", value: statCards.total },
    { label: "نشط", value: statCards.active },
    { label: "معلق", value: statCards.onHold },
    { label: "مكتمل", value: statCards.completed },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المشاريع</h1>
          <p className="text-muted-foreground">إدارة جميع المشاريع على المنصة</p>
        </div>
        <Button>
          <Plus className="size-4" />
          إضافة مشروع
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
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
          <CardTitle>قائمة المشاريع</CardTitle>
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
              searchPlaceholder="بحث باسم المشروع أو العميل..."
              filterGroups={[
                {
                  key: "status",
                  label: "الحالة",
                  options: [
                    { label: "تخطيط", value: "PLANNING" },
                    { label: "نشط", value: "ACTIVE" },
                    { label: "معلق", value: "ON_HOLD" },
                    { label: "بانتظار المراجعة", value: "AWAITING_REVIEW" },
                    { label: "مكتمل", value: "COMPLETED" },
                    { label: "ملغى", value: "CANCELLED" },
                  ],
                },
                {
                  key: "priority",
                  label: "الأولوية",
                  options: [
                    { label: "منخفض", value: "LOW" },
                    { label: "عادي", value: "NORMAL" },
                    { label: "عالي", value: "HIGH" },
                    { label: "عاجل", value: "URGENT" },
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
                icon={FolderKanban}
                title="حدث خطأ"
                description="حدث خطأ أثناء تحميل المشاريع."
              />
            </div>
          ) : projects.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={FolderKanban}
                title="لا توجد مشاريع"
                description="لم يتم إضافة أي مشاريع بعد."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المشروع</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">مدير المشروع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الأولوية</TableHead>
                  <TableHead className="text-right">الإنجاز</TableHead>
                  <TableHead className="text-right">المدة</TableHead>
                  <TableHead className="text-right">القيمة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/admin/projects/${project.id}`}
                        className="text-primary font-medium text-sm hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {project.clientName}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {project.pmName || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminStatusBadge domain="project" status={project.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminStatusBadge domain="task" status={project.priority} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              project.completionPercentage >= 80
                                ? "bg-primary"
                                : project.completionPercentage >= 40
                                  ? "bg-primary/60"
                                  : "bg-warning-500",
                            )}
                            style={{ width: `${project.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {project.completionPercentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString("ar-SA")
                        : "—"}
                      {" - "}
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString("ar-SA")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {project.totalValue.toLocaleString("ar-SA")} ر.س
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
