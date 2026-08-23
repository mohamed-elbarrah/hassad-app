"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { ProjectStatus } from "@hassad/shared";
import {
  useGetProjectsQuery,
  useUpdateProjectStatusMutation,
} from "@/features/projects/projectsApi";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { PROJECT_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/project-status";
import { ProjectKanbanCardContent } from "@/components/dashboard/kanban/cards/ProjectKanbanCardContent";
import { projectErrorMessage } from "@/lib/i18n";
import type { ProjectWithMeta } from "@/lib/utils/project-status";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ProjectKanbanBoardProps {
  projectManagerId?: string;
  search?: string;
  status?: ProjectStatus;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ProjectKanbanBoard({
  projectManagerId,
  search,
  status,
}: ProjectKanbanBoardProps) {
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

  const projects: ProjectWithMeta[] = data?.items ?? [];

  // ── Drag end handler ─────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (itemId: string, _fromStage: string, toStage: string) => {
      try {
        await updateProjectStatus({
          id: itemId,
          body: { status: toStage as ProjectStatus },
        }).unwrap();
      } catch (err: unknown) {
        toast.error(projectErrorMessage(err));
      }
    },
    [updateProjectStatus],
  );

  // ── Render card ──────────────────────────────────────────────────────
  const renderCard = useCallback(
    (project: ProjectWithMeta, _options: { isOverlay: boolean }) => (
      <ProjectKanbanCardContent project={project} />
    ),
    [],
  );

  return (
    <KanbanBoard
      config={PROJECT_STATUS_CONFIG}
      items={projects}
      getItemStage={(p) => p.status}
      renderCard={renderCard}
      onDragEnd={handleDragEnd}
      isLoading={isLoading}
      isError={isError}
      errorMessage="حدث خطأ أثناء تحميل المشاريع"
      emptyMessage="لا توجد مشاريع حالياً — ستظهر المشاريع الجديدة تلقائياً بعد توقيع العقود"
    />
  );
}
