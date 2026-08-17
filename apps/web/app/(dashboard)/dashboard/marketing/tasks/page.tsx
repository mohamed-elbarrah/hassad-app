"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  List,
  Megaphone,
  Search,
  Zap,
} from "lucide-react";
import { TaskPriority, TaskStatus } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useChangeTaskStatusMutation,
  useGetMyTasksQuery,
} from "@/features/tasks/tasksApi";
import { formatDate, daysUntil } from "@/lib/format";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/utils/task-status";

export default function MarketingTasksListPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [priority, setPriority] = useState<"ALL" | TaskPriority>("ALL");
  const [sort, setSort] = useState<"dueDate" | "priority" | "status">(
    "dueDate",
  );
  const { data: rawTasks = [], isLoading } = useGetMyTasksQuery(
    { deptName: "MARKETING", includeCampaigns: true },
    { pollingInterval: 30000 },
  );
  const tasks = rawTasks as any[];
  const filtered = useMemo(
    () =>
      [...tasks]
        .filter((task) => {
          const q = search.toLowerCase();
          return (
            (!q ||
              [
                task.title,
                task.project?.name,
                task.project?.client?.companyName,
              ].some((item) => item?.toLowerCase().includes(q))) &&
            (status === "ALL" || task.status === status) &&
            (priority === "ALL" || task.priority === priority)
          );
        })
        .sort((a, b) =>
          sort === "dueDate"
            ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            : sort === "priority"
              ? ({ URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 } as any)[a.priority] -
                ({ URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 } as any)[b.priority]
              : a.status.localeCompare(b.status),
        ),
    [tasks, search, status, priority, sort],
  );
  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    overdue: tasks.filter(
      (t) => daysUntil(t.dueDate)! < 0 && t.status !== TaskStatus.DONE,
    ).length,
    done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
    campaigns: tasks.reduce((sum, t) => sum + (t.campaigns?.length || 0), 0),
  };
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
              <ClipboardList />
            </div>
            <div>
              <CardTitle className="text-2xl">المهام التسويقية</CardTitle>
              <CardDescription>
                إدارة المهام المسندة إليك ومتابعة حملاتها الإعلانية.
              </CardDescription>
            </div>
          </div>
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as "grid" | "list")}
          >
            <TabsList>
              <TabsTrigger value="grid">
                <LayoutGrid />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "إجمالي المهام", value: stats.total, icon: ClipboardList },
          { label: "قيد التنفيذ", value: stats.inProgress, icon: Zap },
          { label: "متأخرة", value: stats.overdue, icon: AlertTriangle },
          { label: "مكتملة", value: stats.done, icon: CheckCircle2 },
          { label: "الحملات", value: stats.campaigns, icon: Megaphone },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold">{item.value}</p>
              </div>
              <item.icon />
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardHeader className="gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="بحث في المهام أو العملاء..."
                className="pr-10"
              />
            </div>
            <TaskSelect
              value={status}
              onChange={setStatus}
              values={Object.values(TaskStatus)}
              labels={TASK_STATUS_LABELS}
              allLabel="كل الحالات"
            />
            <TaskSelect
              value={priority}
              onChange={setPriority}
              values={Object.values(TaskPriority)}
              labels={TASK_PRIORITY_LABELS}
              allLabel="كل الأولويات"
            />
            <TaskSelect
              value={sort}
              onChange={setSort}
              values={["dueDate", "priority", "status"]}
              labels={{
                dueDate: "الموعد",
                priority: "الأولوية",
                status: "الحالة",
              }}
              allLabel=""
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList />
                </EmptyMedia>
                <EmptyTitle>لا توجد نتائج مطابقة</EmptyTitle>
                <EmptyDescription>
                  جرب تعديل البحث أو إلغاء الفلاتر لعرض المزيد.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatus("ALL");
                    setPriority("ALL");
                  }}
                >
                  مسح الفلاتر
                </Button>
              </EmptyContent>
            </Empty>
          ) : view === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <TaskTable tasks={filtered} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
function TaskSelect({ value, onChange, values, labels, allLabel }: any) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {allLabel && <SelectItem value="ALL">{allLabel}</SelectItem>}
          {values.map((item: string) => (
            <SelectItem key={item} value={item}>
              {labels[item]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
function TaskCard({ task }: { task: any }) {
  const [changeStatus, { isLoading }] = useChangeTaskStatusMutation();
  const overdue =
    daysUntil(task.dueDate)! < 0 && task.status !== TaskStatus.DONE;
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-2">
            <Badge
              variant={
                task.priority === TaskPriority.URGENT
                  ? "destructive"
                  : "secondary"
              }
            >
              {TASK_STATUS_LABELS[task.status]}
            </Badge>
            <Badge variant="outline">
              {TASK_PRIORITY_LABELS[task.priority]}
            </Badge>
          </div>
          <Select
            value={task.status}
            onValueChange={(value) =>
              changeStatus({ id: task.id, status: value as TaskStatus })
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.values(TaskStatus).map((value) => (
                  <SelectItem key={value} value={value}>
                    {TASK_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <CardTitle className="text-base">
          <Link
            href={`/dashboard/marketing/tasks/${task.id}`}
            className="hover:underline"
          >
            {task.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>{task.project?.client?.companyName || "-"}</p>
        <p>{task.project?.name || "-"}</p>
        <p>{task.campaigns?.length || 0} حملة</p>
        <div className="flex items-center justify-between">
          <span>{overdue ? "مهمة متأخرة" : formatDate(task.dueDate)}</span>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/marketing/tasks/${task.id}`}>
              <ArrowUpRight />
              التفاصيل
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function TaskTable({ tasks }: { tasks: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المهمة</TableHead>
          <TableHead>العميل</TableHead>
          <TableHead>المشروع</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>الأولوية</TableHead>
          <TableHead>الموعد</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <Link
                className="font-medium hover:underline"
                href={`/dashboard/marketing/tasks/${task.id}`}
              >
                {task.title}
              </Link>
            </TableCell>
            <TableCell>{task.project?.client?.companyName || "-"}</TableCell>
            <TableCell>{task.project?.name || "-"}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {TASK_STATUS_LABELS[task.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  task.priority === TaskPriority.URGENT
                    ? "destructive"
                    : "outline"
                }
              >
                {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(task.dueDate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
