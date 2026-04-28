"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { ProjectStatus } from "@hassad/shared";
import type { Project } from "@hassad/shared";
import {
  useGetProjectsQuery,
  useUpdateProjectStatusMutation,
} from "@/features/projects/projectsApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { KanbanGroup } from "@/components/dashboard/crm/KanbanGroup";
import { ProjectKanbanColumn } from "./ProjectKanbanColumn";
import { ProjectKanbanCard } from "./ProjectKanbanCard";

interface ProjectWithMeta extends Project {
  client?: { id: string; companyName: string };
  completionPercentage?: number;
}

function resolveKanbanError(error: unknown): string {
  const e = error as FetchBaseQueryError | undefined;
  if (!e) return "حدث خطأ غير متوقع.";
  if (e.status === 401) return "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.";
  if (e.status === 403) return "لا تملك صلاحية الوصول إلى بيانات المشاريع.";
  if (typeof e.status === "number" && e.status >= 500)
    return "خطأ في الخادم. يرجى المحاولة لاحقاً.";
  if (e.status === "FETCH_ERROR")
    return "تعذّر الاتصال بالخادم. تحقق من الشبكة.";
  return "فشل تحميل لوحة المشاريع.";
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "تخطيط",
  [ProjectStatus.ACTIVE]: "نشط",
  [ProjectStatus.ON_HOLD]: "موقوف",
  [ProjectStatus.COMPLETED]: "مكتمل",
  [ProjectStatus.CANCELLED]: "ملغى",
};

const STATUS_COLORS: Record<ProjectStatus, { column: string; dot: string }> = {
  [ProjectStatus.PLANNING]: {
    column: "bg-slate-50 border-slate-200",
    dot: "bg-slate-400",
  },
  [ProjectStatus.ACTIVE]: {
    column: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  [ProjectStatus.ON_HOLD]: {
    column: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  [ProjectStatus.COMPLETED]: {
    column: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  [ProjectStatus.CANCELLED]: {
    column: "bg-rose-50 border-rose-200",
    dot: "bg-rose-500",
  },
};

const KANBAN_GROUPS = [
  {
    id: "planning",
    label: "التخطيط",
    accentClass: "bg-slate-50 border-slate-200 text-slate-700",
    textClass: "text-slate-700",
    statuses: [ProjectStatus.PLANNING],
  },
  {
    id: "execution",
    label: "التنفيذ",
    accentClass: "bg-blue-50 border-blue-200 text-blue-700",
    textClass: "text-blue-700",
    statuses: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD],
  },
  {
    id: "closure",
    label: "الإغلاق",
    accentClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    textClass: "text-emerald-700",
    statuses: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
  },
] as const;

interface ProjectKanbanBoardProps {
  projectManagerId?: string;
  search?: string;
  status?: ProjectStatus;
}

export function ProjectKanbanBoard({
  projectManagerId,
  search,
  status,
}: ProjectKanbanBoardProps) {
  const [activeProject, setActiveProject] = useState<ProjectWithMeta | null>(null);
  const [updateProjectStatus] = useUpdateProjectStatusMutation();

  const { data, isLoading, isError, error } = useGetProjectsQuery(
    {
      limit: 100,
      projectManagerId,
      search,
      status,
    },
    { pollingInterval: 30_000 },
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const projects = (data?.items ?? []) as ProjectWithMeta[];

  const projectsByStatus = useMemo(() => {
    const map = new Map<ProjectStatus, ProjectWithMeta[]>();
    Object.values(ProjectStatus).forEach((status) => map.set(status, []));
    projects.forEach((project) => {
      const status = project.status as ProjectStatus;
      if (map.has(status)) {
        map.set(status, [...(map.get(status) ?? []), project]);
      }
    });
    return map;
  }, [projects]);

  function handleDragStart(event: DragStartEvent) {
    const projectId = event.active.id as string;
    const project = projects.find((item) => item.id === projectId) ?? null;
    setActiveProject(project);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveProject(null);
    if (!over) return;

    const projectId = active.id as string;
    const newStatus = over.id as ProjectStatus;
    const currentStatus = active.data.current?.status as ProjectStatus;

    if (newStatus === currentStatus) return;

    try {
      await updateProjectStatus({
        id: projectId,
        body: { status: newStatus },
      }).unwrap();
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل تحديث حالة المشروع";
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {KANBAN_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2">
            <div className="h-10 bg-muted animate-pulse rounded-lg" />
            <div className="flex gap-3">
              {group.statuses.map((status) => (
                <div
                  key={status}
                  className="w-72 shrink-0 h-48 bg-muted animate-pulse rounded-xl"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-destructive font-medium">
          {resolveKanbanError(error)}
        </p>
      </div>
    );
  }

  const totalProjects = projects.length;
  const emptyBanner = totalProjects === 0 && (
    <div className="mb-4 rounded-xl border-2 border-dashed px-6 py-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        لا توجد مشاريع حالياً — ستظهر المشاريع الجديدة تلقائياً بعد توقيع العقود
      </p>
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5" dir="rtl">
        {emptyBanner}

        {KANBAN_GROUPS.map((group) => {
          const groupCount = group.statuses.reduce(
            (sum, status) => sum + (projectsByStatus.get(status)?.length ?? 0),
            0,
          );

          return (
            <KanbanGroup
              key={group.id}
              id={group.id}
              label={group.label}
              accentClass={group.accentClass}
              textClass={group.textClass}
              totalCount={groupCount}
            >
              {group.statuses.map((status) => (
                <ProjectKanbanColumn
                  key={status}
                  status={status}
                  label={STATUS_LABELS[status]}
                  colorClass={STATUS_COLORS[status].column}
                  dotClass={STATUS_COLORS[status].dot}
                  projects={projectsByStatus.get(status) ?? []}
                />
              ))}
            </KanbanGroup>
          );
        })}
      </div>

      <DragOverlay>
        {activeProject ? <ProjectKanbanCard project={activeProject} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
