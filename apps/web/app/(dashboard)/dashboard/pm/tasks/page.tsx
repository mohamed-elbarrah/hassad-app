"use client";

import Link from "next/link";
import {
  useGetMyTasksQuery,
  useGetMyTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskStatus } from "@hassad/shared";

const STATUS_LABELS: Record<string, string> = {
  TODO: "للتنفيذ",
  IN_PROGRESS: "جارٍ",
  IN_REVIEW: "مراجعة",
  REVISION: "تعديل",
  DONE: "منجزة",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  TODO: "outline",
  IN_PROGRESS: "default",
  IN_REVIEW: "secondary",
  REVISION: "destructive",
  DONE: "secondary",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "عالية",
};

export default function PMTasksPage() {
  const { data: stats, isLoading: statsLoading } = useGetMyTaskStatsQuery();
  const { data: tasks, isLoading: tasksLoading, isError } = useGetMyTasksQuery({});

  const STAT_CARDS = [
    { label: "إجمالي", value: stats?.total ?? 0 },
    { label: "جارية", value: stats?.inProgress ?? 0 },
    { label: "مراجعة", value: stats?.inReview ?? 0 },
    { label: "متأخرة", value: stats?.overdue ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">مهامي</h1>
        <p className="text-sm text-muted-foreground mt-1">
          جميع المهام المسندة إليك.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-semibold">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة المهام</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">حدث خطأ أثناء تحميل المهام.</p>
          )}
          {!tasksLoading && !isError && tasks && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المهمة</TableHead>
                  <TableHead className="text-right">المشروع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الأولوية</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      لا توجد مهام.
                    </TableCell>
                  </TableRow>
                )}
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/pm/tasks/${task.id}`}
                        className="hover:underline text-primary"
                      >
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.project?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[task.status as string] ?? "outline"}>
                        {STATUS_LABELS[task.status as string] ?? task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {PRIORITY_LABELS[task.priority as string] ?? task.priority}
                    </TableCell>
                    <TableCell dir="ltr">
                      {new Date(task.dueDate).toLocaleDateString("ar-DZ")}
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
