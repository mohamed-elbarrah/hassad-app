"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";

import { useGetAdminTasksQuery } from "@/features/admin/adminTasksApi";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_AR } from "@hassad/shared";

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

export default function AdminTasksPage() {
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
    if (activeFilters.priority?.length) f.priority = activeFilters.priority[0];
    return f as any;
  }, [search, page, activeFilters]);

  const { data, isLoading, isError } = useGetAdminTasksQuery(filters);

  const tasks = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const overdue = tasks.filter((t) => t.isOverdue).length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    return { total, overdue, inProgress };
  }, [data, tasks]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المهام</h1>
          <p className="text-muted-foreground">إدارة جميع مهام المنصة</p>
        </div>
        <Button variant="outline" size="sm">
          <FileDown className="size-4" />
          تصدير CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "الإجمالي", value: statCards.total },
          { label: "قيد التنفيذ", value: statCards.inProgress },
          { label: "متأخرة", value: statCards.overdue },
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
        <CardHeader>
          <CardTitle>قائمة المهام</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-4">
            <AdminListToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="بحث بالعنوان أو المسؤول..."
              filterGroups={[
                {
                  key: "status",
                  label: "الحالة",
                  options: [
                    { label: "قيد الانتظار", value: "TODO" },
                    { label: "قيد التنفيذ", value: "IN_PROGRESS" },
                    { label: "قيد المراجعة", value: "IN_REVIEW" },
                    { label: "مكتمل", value: "DONE" },
                    { label: "مراجعة", value: "REVISION" },
                  ],
                },
                {
                  key: "priority",
                  label: "الأولوية",
                  options: [
                    { label: "عاجل", value: "URGENT" },
                    { label: "عالي", value: "HIGH" },
                    { label: "عادي", value: "NORMAL" },
                    { label: "منخفض", value: "LOW" },
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
                icon={CheckSquare}
                title="حدث خطأ"
                description="حدث خطأ أثناء تحميل المهام."
              />
            </div>
          ) : tasks.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={CheckSquare}
                title="لا يوجد مهام"
                description="لم يتم إضافة أي مهام بعد."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المهمة</TableHead>
                  <TableHead className="text-right">المشروع</TableHead>
                  <TableHead className="text-right">المسند إليه</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الأولوية</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/admin/tasks/${task.id}`}
                        className="text-primary font-medium text-sm hover:underline"
                      >
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {task.projectName}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {task.assigneeName || "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {task.department || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminStatusBadge domain="task" status={task.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getPriorityVariant(task.priority)}>
                        {TASK_PRIORITY_AR[
                          task.priority as keyof typeof TASK_PRIORITY_AR
                        ] || task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(task.isOverdue && "text-destructive font-medium")}>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString("ar-SA")
                          : "—"}
                      </span>
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
