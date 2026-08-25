"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProjectStatus } from "@hassad/shared";
import {
  useGetPmProjectsQuery,
  type PmProjectCard,
  useUpdatePmProjectStatusMutation,
} from "@/features/projects/projectsApi";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { PROJECT_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/project-status";
import { ProjectKanbanCardContent } from "@/components/dashboard/kanban/cards/ProjectKanbanCardContent";
import { projectErrorMessage } from "@/lib/i18n";
import type { ProjectWithMeta } from "@/lib/utils/project-status";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ProjectKanbanBoardProps {
  search?: string;
  status?: ProjectStatus;
}

function useProjectStagePage(stage: ProjectStatus, search: string | undefined, enabled: boolean) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PmProjectCard[]>([]);
  const query = useGetPmProjectsQuery({ search, status: stage, page, limit: 10 }, { pollingInterval: 30_000, skip: !enabled });
  useEffect(() => { setPage(1); setItems([]); }, [stage, search]);
  useEffect(() => {
    if (!enabled || !query.data || query.data.meta.page !== page) return;
    setItems((current) => {
      const seen = new Set(current.map((item) => item.id));
      return [...current, ...query.data.items.filter((item) => !seen.has(item.id))];
    });
  }, [enabled, page, query.data]);
  return {
    items, isLoading: query.isLoading, isFetching: query.isFetching, isError: query.isError,
    hasMore: page < (query.data?.meta.totalPages ?? 1),
    onLoadMore: () => { if (!query.isFetching && page < (query.data?.meta.totalPages ?? 1)) setPage((current) => current + 1); },
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ProjectKanbanBoard({
  search,
  status: _status,
}: ProjectKanbanBoardProps) {
  const [updateProjectStatus] = useUpdatePmProjectStatusMutation();
  const stageQueries = [
    useProjectStagePage(ProjectStatus.PLANNING, search, !_status || _status === ProjectStatus.PLANNING),
    useProjectStagePage(ProjectStatus.PENDING_ACTIVATION, search, !_status || _status === ProjectStatus.PENDING_ACTIVATION),
    useProjectStagePage(ProjectStatus.ACTIVE, search, !_status || _status === ProjectStatus.ACTIVE),
    useProjectStagePage(ProjectStatus.ON_HOLD, search, !_status || _status === ProjectStatus.ON_HOLD),
    useProjectStagePage(ProjectStatus.AWAITING_REVIEW, search, !_status || _status === ProjectStatus.AWAITING_REVIEW),
    useProjectStagePage(ProjectStatus.NEEDS_REVISION, search, !_status || _status === ProjectStatus.NEEDS_REVISION),
    useProjectStagePage(ProjectStatus.COMPLETED, search, !_status || _status === ProjectStatus.COMPLETED),
    useProjectStagePage(ProjectStatus.CANCELLED, search, !_status || _status === ProjectStatus.CANCELLED),
  ];
  const isLoading = stageQueries.some((query) => query.isLoading);
  const isError = stageQueries.some((query) => query.isError);
  const projects: ProjectWithMeta[] = stageQueries.flatMap((query) => query.items)
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
      stagePagination={Object.fromEntries(
        PROJECT_STATUS_CONFIG.stageOrder.map((stage, index) => [stage, {
          hasMore: stageQueries[index].hasMore,
          isLoading: stageQueries[index].isFetching,
          onLoadMore: stageQueries[index].onLoadMore,
        }]),
      )}
      />
    </div>
  );
}
