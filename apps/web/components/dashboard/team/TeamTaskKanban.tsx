"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TaskReviewStage, TaskStatus } from "@hassad/shared";
import type { TeamTaskCard, TeamTasksParams } from "@/features/team/teamApi";
import {
  useChangeTeamTaskStatusMutation,
  useLazyGetTeamTasksQuery,
} from "@/features/team/teamApi";
import { pmErrorMessage } from "@/lib/i18n";
import { useAppSelector } from "@/lib/hooks";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { TASK_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/task-status";
import { TeamTaskKanbanCardContent } from "@/components/dashboard/kanban/cards/TeamTaskKanbanCardContent";
import {
  getTaskKanbanStage,
  getTaskStatusForKanbanStage,
  isTaskReviewKanbanStage,
  TASK_KANBAN_STAGE,
} from "@/lib/utils/task-status";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TeamTaskKanbanProps {
  tasks: TeamTaskCard[];
  isLoading: boolean;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  filters?: Omit<TeamTasksParams, "status" | "page">;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TeamTaskKanban({
  tasks,
  isLoading,
  onStatusChange,
  filters,
}: TeamTaskKanbanProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [changeStatus, { isLoading: isUpdating }] =
    useChangeTeamTaskStatusMutation();
  const [loadTasks] = useLazyGetTeamTasksQuery();
  const [localTasks, setLocalTasks] = useState<TeamTaskCard[]>(tasks);
  const [stageState, setStageState] = useState<
    Record<string, { page: number; hasMore: boolean; loading: boolean }>
  >({});

  const loadStage = useCallback(
    async (stage: string) => {
      const stageQuery = {
        status:
          stage === TASK_KANBAN_STAGE.TODO
            ? TaskStatus.TODO
            : stage === TASK_KANBAN_STAGE.IN_PROGRESS
              ? TaskStatus.IN_PROGRESS
              : stage === TASK_KANBAN_STAGE.DONE
                ? TaskStatus.DONE
                : stage === TASK_KANBAN_STAGE.CLIENT_REVIEW
                  ? TaskStatus.CLIENT_REVIEW
                  : stage === TASK_KANBAN_STAGE.PM_REVISION_REQUESTED ||
                      stage === TASK_KANBAN_STAGE.CLIENT_REVISION_REQUESTED
                    ? TaskStatus.REVISION
                    : TaskStatus.IN_REVIEW,
        reviewStage:
          stage === TASK_KANBAN_STAGE.PM_REVIEW
            ? TaskReviewStage.PM_REVIEW
            : stage === TASK_KANBAN_STAGE.CLIENT_REVIEW
              ? TaskReviewStage.CLIENT_REVIEW
              : stage === TASK_KANBAN_STAGE.PM_REVISION_REQUESTED
                ? TaskReviewStage.PM_REVISION_REQUESTED
                : stage === TASK_KANBAN_STAGE.CLIENT_REVISION_REQUESTED
                  ? TaskReviewStage.CLIENT_REVISION_REQUESTED
                  : undefined,
      } as const;
      const state = stageState[stage] ?? {
        page: 0,
        hasMore: true,
        loading: false,
      };
      if (state.loading || !state.hasMore) return;
      // The overview page is global; start each column at page 1 so no task
      // outside the first global page is skipped.
      const nextPage = state.page === 0 ? 1 : state.page + 1;
      setStageState((current) => ({
        ...current,
        [stage]: { ...state, loading: true },
      }));
      try {
        const result = await loadTasks({
          ...filters,
          ...stageQuery,
          page: nextPage,
          limit: 25,
        }).unwrap();
        setLocalTasks((current) => [
          ...current,
          ...result.items.filter(
            (item) => !current.some((existing) => existing.id === item.id),
          ),
        ]);
        setStageState((current) => ({
          ...current,
          [stage]: {
            page: nextPage,
            hasMore: nextPage < result.totalPages,
            loading: false,
          },
        }));
      } catch {
        setStageState((current) => ({
          ...current,
          [stage]: { ...state, loading: false },
        }));
      }
    },
    [filters, loadTasks, stageState],
  );

  useEffect(() => {
    setLocalTasks(tasks);
    setStageState({});
  }, [
    tasks,
    filters?.search,
    filters?.priority,
    filters?.department,
    filters?.projectId,
    filters?.dueBefore,
    filters?.dueAfter,
  ]);

  // ── Permission check for dragging ────────────────────────────────────
  const canDragItem = useCallback(
    (task: TeamTaskCard) => {
      const stage = getTaskKanbanStage(task);
      return Boolean(
        user &&
        stage !== TASK_KANBAN_STAGE.PM_REVIEW &&
        stage !== TASK_KANBAN_STAGE.CLIENT_REVIEW,
      );
    },
    [user],
  );

  const canDropItem = useCallback(
    (task: TeamTaskCard, destinationStage: string) => {
      // The API is the source of truth for capabilities and transition rules.
      return Boolean(
        user &&
        !isTaskReviewKanbanStage(destinationStage) &&
        getTaskKanbanStage(task) !== TASK_KANBAN_STAGE.PM_REVIEW &&
        getTaskKanbanStage(task) !== TASK_KANBAN_STAGE.CLIENT_REVIEW &&
        destinationStage !== TASK_KANBAN_STAGE.PM_REVIEW &&
        destinationStage !== TASK_KANBAN_STAGE.CLIENT_REVIEW &&
        getTaskStatusForKanbanStage(destinationStage) !== task.status,
      );
    },
    [user],
  );

  // ── Drag end handler with optimistic updates ─────────────────────────
  const handleDragEnd = useCallback(
    async (itemId: string, fromStage: string, toStage: string) => {
      if (!user || isUpdating) return;

      const currentStatus = getTaskStatusForKanbanStage(fromStage);
      const newStatus = getTaskStatusForKanbanStage(toStage);

      if (newStatus === currentStatus) return;

      // Optimistic update
      const prevTasks = localTasks;
      const updatedTasks = localTasks.map((t) =>
        t.id === itemId ? { ...t, status: newStatus } : t,
      );
      setLocalTasks(updatedTasks);

      try {
        await changeStatus({ id: itemId, status: newStatus }).unwrap();
        onStatusChange?.(itemId, newStatus);
      } catch (err: unknown) {
        // Rollback on failure
        setLocalTasks(prevTasks);
        toast.error(pmErrorMessage(err));
      }
    },
    [user, localTasks, changeStatus, onStatusChange, isUpdating],
  );

  // ── Render card ──────────────────────────────────────────────────────
  const renderCard = useCallback(
    (task: TeamTaskCard, _options: { isOverlay: boolean }) => (
      <TeamTaskKanbanCardContent task={task} canDrag={canDragItem(task)} />
    ),
    [canDragItem],
  );

  return (
    <KanbanBoard<TeamTaskCard>
      config={TASK_STATUS_CONFIG}
      items={localTasks}
      getItemStage={getTaskKanbanStage}
      renderCard={renderCard}
      onDragEnd={handleDragEnd}
      isLoading={isLoading}
      canDragItem={(task) =>
        !isUpdating &&
        canDragItem(task) &&
        !isTaskReviewKanbanStage(getTaskKanbanStage(task))
      }
      canDropItem={canDropItem}
      stagePagination={Object.fromEntries(
        TASK_STATUS_CONFIG.stageOrder.map((stage) => [
          stage,
          {
            hasMore: stageState[stage]?.hasMore ?? true,
            isLoading: stageState[stage]?.loading ?? false,
            onLoadMore: () => void loadStage(stage),
          },
        ]),
      )}
      onInvalidDrop={() =>
        toast.error(
          pmErrorMessage({
            data: {
              error: { code: "TEAM_TASK_STATUS_FORBIDDEN", details: {} },
            },
          }),
        )
      }
      emptyMessage={
        "لم يتم إسناد أي مهمة إليك بعد. سيتم عرض المهام هنا عند إسنادها."
      }
    />
  );
}
