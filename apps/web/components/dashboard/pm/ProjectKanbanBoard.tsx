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
import {
  useGetProjectsQuery,
  useUpdateProjectStatusMutation,
} from "@/features/projects/projectsApi";
import { KanbanGroup } from "@/components/dashboard/crm/KanbanGroup";
import { ProjectKanbanColumn } from "./ProjectKanbanColumn";
import { ProjectKanbanCard } from "./ProjectKanbanCard";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLOR,
  KANBAN_STATUS_ORDER,
  type ProjectWithMeta,
} from "@/lib/utils/project-status";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProjectKanbanBoardProps {
  projectManagerId?: string;
  search?: string;
  status?: ProjectStatus;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectKanbanBoard({
  projectManagerId,
  search,
  status,
}: ProjectKanbanBoardProps) {
  const [activeProject, setActiveProject] = useState<ProjectWithMeta | null>(
    null,
  );
  const [updateProjectStatus] = useUpdateProjectStatusMutation();

  const { data, isLoading, isError } = useGetProjectsQuery(
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

  // Group projects by status
  const projectsByStatus = useMemo(() => {
    const map = new Map<ProjectStatus, ProjectWithMeta[]>();
    Object.values(ProjectStatus).forEach((s) => map.set(s, []));
    projects.forEach((project) => {
      const projectStatus = project.status as ProjectStatus;
      if (map.has(projectStatus)) {
        map.set(projectStatus, [...(map.get(projectStatus) ?? []), project]);
      }
    });
    return map;
  }, [projects]);

  // Filter visible statuses when a status filter is active
  const visibleStatuses = useMemo(() => {
    if (!status) return KANBAN_STATUS_ORDER;
    // When a specific status is filtered, only show that one
    return KANBAN_STATUS_ORDER.filter((s) => s === status);
  }, [status]);

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

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {KANBAN_STATUS_ORDER.map((s) => (
          <div
            key={s}
            className="w-72 shrink-0 rounded-xl bg-neutral-50/50 border border-neutral-200 animate-pulse"
          >
            <div className="flex items-center gap-2 px-3 py-3 border-b border-neutral-200/60">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              <div className="h-4 w-16 bg-neutral-200 rounded" />
              <div className="ml-auto h-5 w-8 bg-neutral-200 rounded-full" />
            </div>
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white rounded-lg border border-neutral-200"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (isError) {
    return (
      <EmptyState
        title="حدث خطأ أثناء تحميل المشاريع"
        description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
      />
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (projects.length === 0) {
    return (
      <EmptyState
        title="لا توجد مشاريع حالياً"
        description="ستظهر المشاريع الجديدة تلقائياً بعد توقيع العقود."
      />
    );
  }

  // ── Kanban board ─────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex gap-4 overflow-x-auto  p-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent"
        dir="rtl"
      >
        {visibleStatuses.map((s) => (
          <ProjectKanbanColumn
            key={s}
            status={s}
            color={PROJECT_STATUS_COLOR[s]}
            projects={projectsByStatus.get(s) ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProject ? (
          <ProjectKanbanCard project={activeProject} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}