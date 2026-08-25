"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ProjectStatus } from "@hassad/shared";
import {
  useGetPmProjectsQuery,
  useUpdatePmProjectStatusMutation,
} from "@/features/projects/projectsApi";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/project-status";
import { ProjectKanbanCardContent } from "@/components/dashboard/kanban/cards/ProjectKanbanCardContent";
import { projectErrorMessage } from "@/lib/i18n";
import type { ProjectWithMeta } from "@/lib/utils/project-status";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ProjectKanbanBoardProps {
  search?: string;
  status?: ProjectStatus;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ProjectKanbanBoard({
  search,
  status,
}: ProjectKanbanBoardProps) {
  const [updateProjectStatus] = useUpdatePmProjectStatusMutation();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetPmProjectsQuery(
    { search, status, page, limit: 24 },
    { pollingInterval: 30_000 },
  );

  const projects: ProjectWithMeta[] = (data?.items ?? [])
    .map((project) =>
      ({
        id: project.id,
        name: project.name,
        clientId: "",
        projectManagerId: project.projectManager?.id ?? null,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate,
        endDate: project.endDate,
        createdAt: project.updatedAt,
        updatedAt: project.updatedAt,
        completionPercentage: project.completionPercentage,
        manager: project.projectManager,
        client: { id: "", companyName: project.clientName },
        _count: { tasks: project.taskCount },
      }) as ProjectWithMeta,
    );

  // ── Drag end handler ─────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (itemId: string, _fromStage: string, toStage: string) => {
      try {
        await updateProjectStatus({
          id: itemId,
          status: toStage as ProjectStatus,
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
    <div className="flex flex-col gap-4">
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
      {(data?.meta?.totalPages ?? 1) > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">صفحة {page} من {data?.meta?.totalPages}</span>
          <Button variant="outline" disabled={page >= (data?.meta?.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)}>
            التالي
          </Button>
        </div>
      ) : null}
    </div>
  );
}
