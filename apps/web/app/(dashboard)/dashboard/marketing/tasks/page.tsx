"use client";

import { useState, useMemo } from "react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { MetricCard } from "@/components/design-system/MetricCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FilterBar } from "@/components/design-system/FilterBar";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  useGetMyTasksQuery,
  useChangeTaskStatusMutation,
} from "@/features/tasks/tasksApi";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/lib/utils/task-status";
import { TaskStatus, TaskPriority } from "@hassad/shared";
import { formatDate, daysUntil, formatNumber } from "@/lib/format";
import Link from "next/link";
import {
  Calendar,
  ArrowUpRight,
  LayoutGrid,
  List,
  Search,
  ClipboardList,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Megaphone,
  ChevronDown,
  X,
  SlidersHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: TASK_STATUS_LABELS[TaskStatus.TODO], value: TaskStatus.TODO },
  {
    label: TASK_STATUS_LABELS[TaskStatus.IN_PROGRESS],
    value: TaskStatus.IN_PROGRESS,
  },
  {
    label: TASK_STATUS_LABELS[TaskStatus.IN_REVIEW],
    value: TaskStatus.IN_REVIEW,
  },
  {
    label: TASK_STATUS_LABELS[TaskStatus.REVISION],
    value: TaskStatus.REVISION,
  },
  { label: TASK_STATUS_LABELS[TaskStatus.DONE], value: TaskStatus.DONE },
];

const PRIORITY_OPTIONS = [
  { label: TASK_PRIORITY_LABELS[TaskPriority.LOW], value: TaskPriority.LOW },
  {
    label: TASK_PRIORITY_LABELS[TaskPriority.NORMAL],
    value: TaskPriority.NORMAL,
  },
  {
    label: TASK_PRIORITY_LABELS[TaskPriority.HIGH],
    value: TaskPriority.HIGH,
  },
  {
    label: TASK_PRIORITY_LABELS[TaskPriority.URGENT],
    value: TaskPriority.URGENT,
  },
];

const TASK_STATUS_BADGE: Record<string, string> = {
  [TaskStatus.TODO]: "PENDING",
  [TaskStatus.IN_PROGRESS]: "ACTIVE",
  [TaskStatus.IN_REVIEW]: "WARNING",
  [TaskStatus.REVISION]: "DANGER",
  [TaskStatus.DONE]: "COMPLETED",
};

const PRIORITY_STATUS_BADGE: Record<string, string> = {
  [TaskPriority.LOW]: "PENDING",
  [TaskPriority.NORMAL]: "PENDING",
  [TaskPriority.HIGH]: "WARNING",
  [TaskPriority.URGENT]: "DANGER",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketingTasksListPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "status">(
    "dueDate",
  );

  const { data: rawTasks = [], isLoading } = useGetMyTasksQuery(
    { deptName: "MARKETING", includeCampaigns: true },
    { pollingInterval: 30000 },
  );

  const tasks = rawTasks as any[];

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...tasks];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.project?.client?.companyName?.toLowerCase().includes(q) ||
          t.project?.name?.toLowerCase().includes(q),
      );
    }

    // Status filter
    const statusFilters = activeFilters["status"] ?? [];
    if (statusFilters.length > 0) {
      result = result.filter((t) => statusFilters.includes(t.status));
    }

    // Priority filter
    const priorityFilters = activeFilters["priority"] ?? [];
    if (priorityFilters.length > 0) {
      result = result.filter((t) => priorityFilters.includes(t.priority));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "dueDate") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "priority") {
        const prioOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
        return (prioOrder as any)[a.priority] - (prioOrder as any)[b.priority];
      }
      if (sortBy === "status") {
        const statusOrder = {
          IN_PROGRESS: 0,
          TODO: 1,
          IN_REVIEW: 2,
          REVISION: 3,
          DONE: 4,
        };
        return (statusOrder as any)[a.status] - (statusOrder as any)[b.status];
      }
      return 0;
    });

    return result;
  }, [tasks, search, activeFilters, sortBy]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const overdue = tasks.filter((t: any) => {
      const days = daysUntil(t.dueDate);
      return days !== null && days < 0 && t.status !== TaskStatus.DONE;
    }).length;
    const done = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const totalCampaigns = tasks.reduce(
      (sum, t) => sum + (t.campaigns?.length || 0),
      0,
    );
    return { total, inProgress, overdue, done, totalCampaigns };
  }, [tasks]);

  const filterGroups = [
    {
      key: "status",
      label: "حالة المهمة",
      options: STATUS_OPTIONS.map((o) => ({
        ...o,
        count: tasks.filter((t) => t.status === o.value).length,
      })),
    },
    {
      key: "priority",
      label: "الأولوية",
      options: PRIORITY_OPTIONS.map((o) => ({
        ...o,
        count: tasks.filter((t) => t.priority === o.value).length,
      })),
    },
  ];

  const hasFilters =
    search || Object.values(activeFilters).some((v) => v.length > 0);

  const emptyState = hasFilters
    ? {
        icon: Search,
        title: "لا توجد نتائج مطابقة",
        description: "جرب تعديل البحث أو إلغاء الفلاتر لعرض المزيد.",
      }
    : {
        icon: ClipboardList,
        title: "لا توجد مهام تسويقية",
        description: "لم يتم إسناد أي مهمة تسويقية إليك بعد.",
      };

  return (
    <div className="flex flex-col gap-6 pb-10" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            المهام التسويقية
          </h1>
          <p className="text-neutral-300 mt-2">
            إدارة المهام المسندة إليك ومتابعة حملاتها الإعلانية.
          </p>
        </div>
        <div className="flex items-center gap-2 border rounded-xl p-1 bg-neutral-50/50">
          <ActionButton
            variant={view === "grid" ? "toggle-active" : "toggle-inactive"}
            size="sm"
            onClick={() => setView("grid")}
            className="h-8 w-8 p-0"
          >
            <LayoutGrid className="w-4 h-4" />
          </ActionButton>
          <ActionButton
            variant={view === "list" ? "toggle-active" : "toggle-inactive"}
            size="sm"
            onClick={() => setView("list")}
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </ActionButton>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="إجمالي المهام"
          value={stats.total}
          icon={ClipboardList}
          variant="default"
        />
        <MetricCard
          title="قيد التنفيذ"
          value={stats.inProgress}
          icon={Zap}
          variant="warning"
        />
        <MetricCard
          title="متأخرة"
          value={stats.overdue}
          icon={AlertTriangle}
          variant={stats.overdue > 0 ? "danger" : "default"}
        />
        <MetricCard
          title="مكتملة"
          value={stats.done}
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="الحملات"
          value={stats.totalCampaigns}
          icon={Megaphone}
          variant="default"
        />
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
            <input
              type="text"
              placeholder="بحث في المهام أو العملاء..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pr-9 pl-8 rounded-xl border border-portal-card-border bg-natural-0 text-sm text-right
                placeholder:text-neutral-200 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-neutral-100 text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter */}
          <FilterBar
            groups={filterGroups}
            activeFilters={activeFilters}
            onFilterChange={(key, vals) =>
              setActiveFilters((prev) => ({ ...prev, [key]: vals }))
            }
          />
        </div>

        {/* Sort + Result count */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-300">
            {filtered.length} مهمة
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 px-4 h-9 text-sm font-medium text-portal-icon hover:bg-badge-gray-bg transition-colors cursor-pointer">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {sortBy === "dueDate"
                  ? "الموعد"
                  : sortBy === "priority"
                    ? "الأولوية"
                    : "الحالة"}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-right">
              <DropdownMenuItem
                onClick={() => setSortBy("dueDate")}
                className="text-xs"
              >
                ترتيب حسب الموعد
                {sortBy === "dueDate" && (
                  <span className="mr-auto text-secondary-500">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("priority")}
                className="text-xs"
              >
                ترتيب حسب الأولوية
                {sortBy === "priority" && (
                  <span className="mr-auto text-secondary-500">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("status")}
                className="text-xs"
              >
                ترتيب حسب الحالة
                {sortBy === "status" && (
                  <span className="mr-auto text-secondary-500">✓</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-[30px]" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-[30px]" />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          actionLabel={hasFilters ? "مسح الفلاتر" : undefined}
          onAction={
            hasFilters
              ? () => {
                  setSearch("");
                  setActiveFilters({});
                }
              : undefined
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <TaskListRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Task Card (Grid View) ───────────────────────────────────────────────────

function TaskCard({ task }: { task: any }) {
  const [changeTaskStatus, { isLoading: isChanging }] =
    useChangeTaskStatusMutation();
  const days = daysUntil(task.dueDate);
  const isOverdue =
    days !== null && days < 0 && task.status !== TaskStatus.DONE;
  const campaignCount = task.campaigns?.length || 0;

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== task.status) {
      changeTaskStatus({ id: task.id, status: newStatus as TaskStatus });
    }
  };

  return (
    <SurfaceCard
      className="group overflow-hidden shadow-sm border-portal-card-border hover:border-secondary-500/40 transition-all flex flex-col"
      contentClassName="p-0"
    >
      {/* Header */}
      <div className="p-5 pb-3 border-b border-portal-divider">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge
              status={TASK_STATUS_BADGE[task.status] || "PENDING"}
              label={
                TASK_STATUS_LABELS[task.status as TaskStatus] || task.status
              }
              className="text-[10px]"
            />
            {task.priority !== TaskPriority.LOW &&
              task.priority !== TaskPriority.NORMAL && (
                <StatusBadge
                  status={PRIORITY_STATUS_BADGE[task.priority] || "WARNING"}
                  label={
                    TASK_PRIORITY_LABELS[task.priority as TaskPriority] ||
                    task.priority
                  }
                  className="text-[10px]"
                />
              )}
          </div>
          <TaskStatusDropdown
            status={task.status}
            onChange={handleStatusChange}
            disabled={isChanging}
          />
        </div>

        <Link href={`/dashboard/marketing/tasks/${task.id}`}>
          <h3 className="text-lg font-semibold group-hover:text-secondary-500 transition-colors leading-snug line-clamp-2">
            {task.title}
          </h3>
        </Link>
      </div>

      {/* Body */}
      <div className="p-5 pt-4 flex-1 space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">العميل</span>
            <span className="font-semibold text-natural-100 truncate max-w-[140px]">
              {task.project?.client?.companyName || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">المشروع</span>
            <span className="font-medium text-neutral-300 truncate max-w-[140px]">
              {task.project?.name || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">الحملات</span>
            <span className="font-medium text-natural-100">
              {campaignCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-secondary-500">
                  <Megaphone className="w-3.5 h-3.5" />
                  {campaignCount}
                </span>
              ) : (
                <span className="text-neutral-300">—</span>
              )}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-portal-divider">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-300" />
            <span
              className={`text-xs font-medium ${
                isOverdue
                  ? "text-danger-600"
                  : days !== null && days <= 3
                    ? "text-alert-600"
                    : "text-neutral-300"
              }`}
            >
              {isOverdue
                ? `متأخرة ${Math.abs(days)} يوم`
                : days !== null && days <= 3 && days >= 0
                  ? `متبقي ${days} يوم`
                  : formatDate(task.dueDate)}
            </span>
          </div>
          <Link href={`/dashboard/marketing/tasks/${task.id}`}>
            <ActionButton
              size="sm"
              className="gap-2"
              icon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              التفاصيل
            </ActionButton>
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}

// ── Task List Row ───────────────────────────────────────────────────────────

function TaskListRow({ task }: { task: any }) {
  const [changeTaskStatus, { isLoading: isChanging }] =
    useChangeTaskStatusMutation();
  const days = daysUntil(task.dueDate);
  const isOverdue =
    days !== null && days < 0 && task.status !== TaskStatus.DONE;
  const campaignCount = task.campaigns?.length || 0;

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== task.status) {
      changeTaskStatus({ id: task.id, status: newStatus as TaskStatus });
    }
  };

  return (
    <SurfaceCard
      className="group shadow-sm border-portal-card-border hover:border-secondary-500/40 transition-all"
      contentClassName="p-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Title + badges + meta */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge
                status={TASK_STATUS_BADGE[task.status] || "PENDING"}
                label={
                  TASK_STATUS_LABELS[task.status as TaskStatus] || task.status
                }
                className="text-[10px]"
              />
              {task.priority !== TaskPriority.LOW &&
                task.priority !== TaskPriority.NORMAL && (
                  <StatusBadge
                    status={PRIORITY_STATUS_BADGE[task.priority] || "WARNING"}
                    label={
                      TASK_PRIORITY_LABELS[task.priority as TaskPriority] ||
                      task.priority
                    }
                    className="text-[10px]"
                  />
                )}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-danger-600 bg-danger-50 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  متأخرة {Math.abs(days)} يوم
                </span>
              )}
            </div>
            <Link href={`/dashboard/marketing/tasks/${task.id}`}>
              <h3 className="font-semibold text-sm group-hover:text-secondary-500 transition-colors truncate">
                {task.title}
              </h3>
            </Link>
            <div className="flex items-center gap-3 text-xs text-neutral-300 flex-wrap">
              <span>{task.project?.client?.companyName}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{task.project?.name}</span>
              {campaignCount > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-secondary-500">
                    <Megaphone className="w-3 h-3" />
                    {campaignCount} حملة
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Due date + status dropdown + action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-left min-w-[100px]">
            <p className="text-[10px] text-neutral-300">الموعد</p>
            <p
              className={`text-xs font-medium ${
                isOverdue ? "text-danger-600" : "text-natural-100"
              }`}
            >
              {formatDate(task.dueDate)}
            </p>
          </div>
          <TaskStatusDropdown
            status={task.status}
            onChange={handleStatusChange}
            disabled={isChanging}
          />
          <Link href={`/dashboard/marketing/tasks/${task.id}`}>
            <ActionButton size="sm" variant="outline" className="gap-1">
              التفاصيل
              <ArrowUpRight className="w-3 h-3" />
            </ActionButton>
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}

// ── Task Status Dropdown ────────────────────────────────────────────────────

function TaskStatusDropdown({
  status,
  onChange,
  disabled,
}: {
  status: string;
  onChange: (status: string) => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-lg border border-portal-card-border bg-natural-0 px-2 py-1 text-[10px] font-medium text-portal-icon hover:bg-badge-gray-bg transition-colors cursor-pointer disabled:opacity-50"
        >
          تغيير
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="text-right">
        {STATUS_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled || opt.value === status}
            className="text-xs"
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ml-2 ${
                opt.value === TaskStatus.TODO
                  ? "bg-neutral-300"
                  : opt.value === TaskStatus.IN_PROGRESS
                    ? "bg-action-blue"
                    : opt.value === TaskStatus.IN_REVIEW
                      ? "bg-alert-500"
                      : opt.value === TaskStatus.REVISION
                        ? "bg-danger-500"
                        : "bg-success-500"
              }`}
            />
            {opt.label}
            {opt.value === status && (
              <span className="mr-auto text-[10px] text-secondary-500">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
