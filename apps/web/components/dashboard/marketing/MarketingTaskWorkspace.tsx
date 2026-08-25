"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Calendar, ClipboardList, LayoutGrid, List, Search } from "lucide-react";
import { TaskPriority, TaskStatus } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { TASK_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/task-status";
import { useChangeMarketingTaskStatusMutation, type MarketingTask } from "@/features/marketing/marketingApi";
import { formatDate, daysUntil } from "@/lib/format";
import { marketingErrorMessage } from "@/lib/i18n";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/utils/task-status";
import { toast } from "sonner";


interface MarketingTaskWorkspaceProps {
  tasks: MarketingTask[];
  isLoading?: boolean;
}

export function MarketingTaskWorkspace({ tasks, isLoading = false }: MarketingTaskWorkspaceProps) {
  const [view, setView] = useState<"table" | "kanban">("kanban");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [priority, setPriority] = useState<"ALL" | TaskPriority>("ALL");
  const [changeStatus, { isLoading: isUpdating }] = useChangeMarketingTaskStatusMutation();
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const filtered = useMemo(() => localTasks.filter((task) => {
    const query = search.trim().toLowerCase();
    const searchable = [task.title, task.project?.name, task.project?.client?.companyName]
      .filter(Boolean).join(" ").toLowerCase();
    return (!query || searchable.includes(query)) &&
      (status === "ALL" || task.status === status) &&
      (priority === "ALL" || task.priority === priority);
  }), [localTasks, priority, search, status]);

  async function handleStatusChange(id: string, nextStatus: string) {
    const next = nextStatus as TaskStatus;
    const previous = localTasks;
    setLocalTasks((current) => current.map((task) => task.id === id ? { ...task, status: next } : task));
    try {
      await changeStatus({ id, status: next }).unwrap();
    } catch (error) {
      setLocalTasks(previous);
      toast.error(marketingErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="البحث في المهام أو العملاء" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث في المهام أو العملاء..." className="pr-10" />
            </div>
            <TaskFilter value={status} onChange={(value) => setStatus(value as "ALL" | TaskStatus)} values={Object.values(TaskStatus)} labels={TASK_STATUS_LABELS} allLabel="كل الحالات" />
            <TaskFilter value={priority} onChange={(value) => setPriority(value as "ALL" | TaskPriority)} values={Object.values(TaskPriority)} labels={TASK_PRIORITY_LABELS} allLabel="كل الأولويات" />
        </div>
        <Tabs value={view} onValueChange={(value) => setView(value as "table" | "kanban")}>
          <TabsList>
            <TabsTrigger value="kanban"><LayoutGrid /> كانبان</TabsTrigger>
            <TabsTrigger value="table"><List /> جدول</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {isLoading ? <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div> : filtered.length === 0 ? (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><ClipboardList /></EmptyMedia><EmptyTitle>لا توجد نتائج مطابقة</EmptyTitle><EmptyDescription>جرب تعديل البحث أو الفلاتر لعرض المزيد.</EmptyDescription></EmptyHeader></Empty>
      ) : view === "kanban" ? (
        <KanbanBoard
          config={TASK_STATUS_CONFIG}
          items={filtered}
          getItemStage={(task) => task.status}
          renderCard={(task) => <MarketingTaskCard task={task} />}
          onDragEnd={(id, _from, to) => handleStatusChange(id, to)}
          isLoading={isUpdating}
          canDragItem={() => !isUpdating}
          canDropItem={(task, destination) => task.status !== destination && destination !== TaskStatus.TODO && destination !== TaskStatus.DONE}
          emptyMessage="لا توجد مهام في هذه المرحلة."
        />
      ) : <MarketingTaskTable tasks={filtered} />}
    </div>
  );
}

function TaskFilter({ value, onChange, values, labels, allLabel }: { value: string; onChange: (value: string) => void; values: string[]; labels: Record<string, string>; allLabel: string }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="ALL">{allLabel}</SelectItem>{values.map((item) => <SelectItem key={item} value={item}>{labels[item]}</SelectItem>)}</SelectGroup></SelectContent></Select>;
}

function MarketingTaskCard({ task }: { task: MarketingTask }) {
  return <div className="flex flex-col gap-2"><Link href={`/dashboard/marketing/tasks/${task.id}`} className="font-semibold leading-tight hover:underline">{task.title}</Link><p className="text-xs text-muted-foreground">{task.project?.client?.companyName || "-"}</p><div className="flex flex-wrap gap-1"><Badge variant="outline">{TASK_PRIORITY_LABELS[task.priority]}</Badge><Badge variant="secondary">{task.campaigns?.length || 0} حملة</Badge></div><div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="size-3.5" />{formatDate(task.dueDate)}</div><Link href={`/dashboard/marketing/tasks/${task.id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">التفاصيل <ArrowUpRight className="size-3.5" /></Link></div>;
}

function MarketingTaskTable({ tasks }: { tasks: MarketingTask[] }) {
  return <Table><TableHeader><TableRow><TableHead>المهمة</TableHead><TableHead>العميل</TableHead><TableHead>الحملات</TableHead><TableHead>الحالة</TableHead><TableHead>الأولوية</TableHead><TableHead>الموعد</TableHead></TableRow></TableHeader><TableBody>{tasks.map((task) => { const overdue = daysUntil(task.dueDate)! < 0 && task.status !== TaskStatus.DONE; return <TableRow key={task.id}><TableCell><Link href={`/dashboard/marketing/tasks/${task.id}`} className="font-medium hover:underline">{task.title}</Link></TableCell><TableCell>{task.project?.client?.companyName || "-"}</TableCell><TableCell>{task.campaigns?.map((campaign) => campaign.name).join("، ") || "-"}</TableCell><TableCell><Badge variant="secondary">{TASK_STATUS_LABELS[task.status]}</Badge></TableCell><TableCell><Badge variant={task.priority === TaskPriority.URGENT ? "destructive" : "outline"}>{TASK_PRIORITY_LABELS[task.priority]}</Badge></TableCell><TableCell className={overdue ? "font-medium text-destructive" : ""}>{formatDate(task.dueDate)}</TableCell></TableRow>; })}</TableBody></Table>;
}
