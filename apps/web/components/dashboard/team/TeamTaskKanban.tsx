"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TaskStatus } from "@hassad/shared";
import type { TeamTaskCard, TeamTasksParams } from "@/features/team/teamApi";
import { useChangeTeamTaskStatusMutation, useLazyGetTeamTasksQuery } from "@/features/team/teamApi";
import { pmErrorMessage } from "@/lib/i18n";
import { useAppSelector } from "@/lib/hooks";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { TASK_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/task-status";
import { TeamTaskKanbanCardContent } from "@/components/dashboard/kanban/cards/TeamTaskKanbanCardContent";

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
  const [changeStatus, { isLoading: isUpdating }] = useChangeTeamTaskStatusMutation();
  const [loadTasks] = useLazyGetTeamTasksQuery();
  const [localTasks, setLocalTasks] = useState<TeamTaskCard[]>(tasks);
  const [stageState, setStageState] = useState<Record<string, { page: number; hasMore: boolean; loading: boolean }>>({});

  const loadStage = useCallback(async (stage: string) => {
    const state = stageState[stage] ?? { page: 0, hasMore: true, loading: false };
    if (state.loading || !state.hasMore) return;
    // The overview page is global; start each column at page 1 so no task
    // outside the first global page is skipped.
    const nextPage = state.page === 0 ? 1 : state.page + 1;
    setStageState((current) => ({ ...current, [stage]: { ...state, loading: true } }));
    try {
      const result = await loadTasks({ ...filters, status: stage as TaskStatus, page: nextPage, limit: 25 }).unwrap();
      setLocalTasks((current) => [...current, ...result.items.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setStageState((current) => ({ ...current, [stage]: { page: nextPage, hasMore: nextPage < result.totalPages, loading: false } }));
    } catch {
      setStageState((current) => ({ ...current, [stage]: { ...state, loading: false } }));
    }
  }, [filters, loadTasks, stageState]);

  useEffect(() => {
    setLocalTasks(tasks);
    setStageState({});
  }, [tasks, filters?.search, filters?.priority, filters?.department, filters?.projectId, filters?.dueBefore, filters?.dueAfter]);

  // ── Permission check for dragging ────────────────────────────────────
  const canDragItem = useCallback(
    (_task: TeamTaskCard) => {
      return Boolean(user);
    },
    [user],
  );

  const canDropItem = useCallback(
    (task: TeamTaskCard, destinationStage: string) => {
      // The API is the source of truth for capabilities and transition rules.
      return Boolean(user && destinationStage !== task.status);
    },
    [user],
  );

  // ── Drag end handler with optimistic updates ─────────────────────────
  const handleDragEnd = useCallback(
    async (itemId: string, fromStage: string, toStage: string) => {
      if (!user || isUpdating) return;

      const currentStatus = fromStage as TaskStatus;
      const newStatus = toStage as TaskStatus;

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
    [
      user,
      localTasks,
      changeStatus,
      onStatusChange,
      isUpdating,
    ],
  );

  // ── Render card ──────────────────────────────────────────────────────
  const renderCard = useCallback(
    (task: TeamTaskCard, _options: { isOverlay: boolean }) => (
      <TeamTaskKanbanCardContent task={task} canDrag={canDragItem(task)} />
    ),
    [canDragItem],
  );

  return (
    <KanbanBoard
      config={TASK_STATUS_CONFIG}
      items={localTasks}
      getItemStage={(t) => t.status}
      renderCard={renderCard}
      onDragEnd={handleDragEnd}
      isLoading={isLoading}
      canDragItem={(task) => !isUpdating && canDragItem(task)}
      canDropItem={canDropItem}
      stagePagination={Object.fromEntries(Object.values(TaskStatus).map((stage) => [stage, {
        hasMore: stageState[stage]?.hasMore ?? true,
        isLoading: stageState[stage]?.loading ?? false,
        onLoadMore: () => void loadStage(stage),
      }]))}
      onInvalidDrop={() => toast.error(pmErrorMessage({ data: { error: { code: "TEAM_TASK_STATUS_FORBIDDEN", details: {} } } }))}
      emptyMessage={
        "لم يتم إسناد أي مهمة إليك بعد. سيتم عرض المهام هنا عند إسنادها."
      }
    />
  );
}
