"use client";

import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Calendar,
  ArrowUpRight,
  Target,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  useGetMyTasksQuery,
  useChangeTaskStatusMutation,
} from "@/features/tasks/tasksApi";
import { useState } from "react";
import { Skeleton } from "@/components/design-system/Skeleton";

export default function MarketingTasksListPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const { data: tasks = [], isLoading } = useGetMyTasksQuery(
    { deptName: "MARKETING" },
    { pollingInterval: 30000 },
  );

  return (
    <div className="flex flex-col gap-6 pb-10" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            المهام التسويقية المسندة
          </h1>
          <p className="text-neutral-300 mt-2">
            جميع المهام التي تم إسنادها إليك من قبل مديري المشاريع.
          </p>
        </div>
        <div className="flex items-center gap-2 border rounded-lg p-1 bg-neutral-50/50">
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  const [changeTaskStatus, { isLoading: isChanging }] =
    useChangeTaskStatusMutation();

  const statusOptions = [
    { label: "قيد الانتظار", value: "TODO" },
    { label: "قيد التنفيذ", value: "IN_PROGRESS" },
    { label: "قيد المراجعة", value: "IN_REVIEW" },
    { label: "مكتمل", value: "DONE" },
  ];

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== task.status) {
      changeTaskStatus({ id: task.id, status: newStatus as any });
    }
  };

  return (
    <SurfaceCard
      className="group overflow-hidden shadow-sm border-neutral-50/60 hover:border-secondary-500/40 transition-all flex flex-col"
      contentClassName="p-0"
    >
      <div className="pb-3 border-b border-neutral-50/40 bg-neutral-50/5 p-6">
        <div className="flex justify-between items-start gap-2 mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ActionButton
                variant="outline"
                size="sm"
                className={`h-6 px-2 text-[10px] font-bold gap-1 ${getStatusColor(task.status)}`}
              >
                {getStatusLabel(task.status)}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </ActionButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-right">
              {statusOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={isChanging || opt.value === task.status}
                  className="text-xs"
                >
                  {opt.label}
                  {opt.value === task.status && (
                    <span className="mr-auto text-[10px] opacity-60">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="text-lg group-hover:text-secondary-500 transition-colors leading-snug font-semibold">
          {task.title}
        </h3>
      </div>

      <div className="pt-4 flex-1 space-y-4 p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium">العميل</span>
            <span className="font-bold">
              {task.project?.client?.companyName}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium">المشروع</span>
            <span className="font-medium text-neutral-300">
              {task.project?.name}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-50/40">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-300 font-medium">
                الموعد
              </span>
              <span className="text-sm font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-300" />
                {new Date(task.dueDate).toLocaleDateString("ar-EG")}
              </span>
            </div>
          </div>
          <Link href={`/dashboard/marketing/tasks/${task.id}`}>
            <ActionButton size="sm" className="gap-2">
              التنفيذ
              <ArrowUpRight className="w-4 h-4" />
            </ActionButton>
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case "TODO":
      return "TODO";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "IN_REVIEW":
      return "IN_REVIEW";
    case "DONE":
      return "DONE";
    default:
      return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "TODO":
      return "bg-neutral-50 text-neutral-300 border-neutral-200 hover:bg-neutral-50";
    case "IN_PROGRESS":
      return "bg-action-blue/10 text-action-blue border-action-blue/20 hover:bg-action-blue/10";
    case "IN_REVIEW":
      return "bg-alert-100 text-alert-700 border-alert-200 hover:bg-alert-100";
    case "DONE":
      return "bg-success-100 text-success-700 border-success-200 hover:bg-success-100";
    default:
      return "bg-neutral-50 text-neutral-300";
  }
}
