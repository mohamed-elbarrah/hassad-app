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
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";

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
  [ProjectStatus.AWAITING_REVIEW]: "بانتظار المراجعة",
  [ProjectStatus.NEEDS_REVISION]: "مطلوب تعديلات",
  [ProjectStatus.COMPLETED]: "مكتمل",
  [ProjectStatus.CANCELLED]: "ملغى",
};

/* ── Softer status dot colors (design tokens) ─────────────────────────────── */
const STATUS_DOT_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "#A8ABB2",
  [ProjectStatus.ACTIVE]: "#2684FC",
  [ProjectStatus.ON_HOLD]: "#F8AF01",
  [ProjectStatus.AWAITING_REVIEW]: "#F8AF01",
  [ProjectStatus.NEEDS_REVISION]: "#FB3748",
  [ProjectStatus.COMPLETED]: "#0ED589",
  [ProjectStatus.CANCELLED]: "#FB3748",
};

const KANBAN_GROUPS = [
  {
    id: "planning",
    label: "التخطيط",
    statuses: [ProjectStatus.PLANNING],
  },
  {
    id: "execution",
    label: "التنفيذ",
    statuses: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD],
  },
  {
    id: "review",
    label: "المراجعة",
    statuses: [ProjectStatus.AWAITING_REVIEW, ProjectStatus.NEEDS_REVISION],
  },
  {
    id: "closure",
    label: "الإغلاق",
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
  const [activeProject, setActiveProject] = useState<ProjectWithMeta | null>(
    null,
  );
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
            <div className="h-10 bg-portal-bg animate-pulse rounded-xl border border-portal-card-border" />
            <div className="flex gap-3">
              {group.statuses.map((status) => (
                <div
                  key={status}
                  className="w-72 shrink-0 h-48 bg-white animate-pulse rounded-2xl border border-portal-card-border"
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
        <p className="text-danger-500 font-medium">
          {resolveKanbanError(error)}
        </p>
      </div>
    );
  }

  const totalProjects = projects.length;
  const emptyBanner = totalProjects === 0 && (
    <div className="mb-4 rounded-2xl border-[1.5px] border-dashed border-portal-card-border px-6 py-4 text-center bg-white">
      <p className="text-sm font-medium text-portal-note-text">
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
              totalCount={groupCount}
            >
              <div className="flex gap-3 overflow-x-auto pb-2">
                {group.statuses.map((status) => (
                  <ProjectKanbanColumn
                    key={status}
                    status={status}
                    label={STATUS_LABELS[status]}
                    dotColor={STATUS_DOT_COLORS[status]}
                    projects={projectsByStatus.get(status) ?? []}
                  />
                ))}
              </div>
            </KanbanGroup>
          );
        })}
      </div>

      <DragOverlay>
        {activeProject ? (
          <ProjectKanbanCard project={activeProject} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
