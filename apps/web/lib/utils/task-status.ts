/**
 * Centralized task status utilities.
 *
 * Single source of truth for Arabic labels, tone classes, and kanban layout.
 */
import {
  TaskReviewStage,
  TaskStatus,
  TASK_PRIORITY_AR,
  type Task,
} from "@hassad/shared";
import {
  KANBAN_TONES,
  type KanbanToneClasses,
} from "@/components/dashboard/kanban/theme";

// ── Extended task type (includes API relations) ─────────────────────────────

export interface TaskWithMeta extends Task {
  assignee?: { id: string; name: string };
}

// ── Task status tone classes (distinct per status) ─────────────────────────
// Each status has a consistent tokenized tone for dashboard surfaces.

export const TASK_STATUS_TONES: Record<TaskStatus, KanbanToneClasses> = {
  [TaskStatus.TODO]: KANBAN_TONES.neutral,
  [TaskStatus.IN_PROGRESS]: KANBAN_TONES.blue,
  [TaskStatus.IN_REVIEW]: KANBAN_TONES.purple,
  [TaskStatus.CLIENT_REVIEW]: KANBAN_TONES.blue,
  [TaskStatus.REVISION]: KANBAN_TONES.orange,
  [TaskStatus.DONE]: KANBAN_TONES.green,
};

// ── Task status Arabic labels ──────────────────────────────────────────────

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "للتنفيذ",
  [TaskStatus.IN_PROGRESS]: "قيد التنفيذ",
  [TaskStatus.IN_REVIEW]: "قيد مراجعة مدير المشروع",
  [TaskStatus.CLIENT_REVIEW]: "قيد مراجعة العميل",
  [TaskStatus.REVISION]: "يحتاج تعديل",
  [TaskStatus.DONE]: "منجز",
};

// ── Kanban order (left to right flow) ───────────────────────────────────────

export const TASK_KANBAN_STAGE = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  PM_REVIEW: "PM_REVIEW",
  CLIENT_REVIEW: "CLIENT_REVIEW",
  PM_REVISION_REQUESTED: "PM_REVISION_REQUESTED",
  CLIENT_REVISION_REQUESTED: "CLIENT_REVISION_REQUESTED",
  DONE: "DONE",
} as const;

export type TaskKanbanStage =
  (typeof TASK_KANBAN_STAGE)[keyof typeof TASK_KANBAN_STAGE];

export const TASK_KANBAN_STAGE_LABELS: Record<TaskKanbanStage, string> = {
  TODO: "للتنفيذ",
  IN_PROGRESS: "قيد التنفيذ",
  PM_REVIEW: "قيد مراجعة مدير المشروع",
  CLIENT_REVIEW: "قيد مراجعة العميل",
  PM_REVISION_REQUESTED: "تعديل مطلوب من مدير المشروع",
  CLIENT_REVISION_REQUESTED: "تعديل مطلوب من العميل",
  DONE: "منجز",
};

export function getTaskKanbanStage(
  task: Pick<Task, "status" | "reviewStage">,
): TaskKanbanStage {
  if (task.status === TaskStatus.TODO) return TASK_KANBAN_STAGE.TODO;
  if (task.status === TaskStatus.IN_PROGRESS)
    return TASK_KANBAN_STAGE.IN_PROGRESS;
  if (task.status === TaskStatus.CLIENT_REVIEW)
    return TASK_KANBAN_STAGE.CLIENT_REVIEW;
  if (task.status === TaskStatus.REVISION)
    return TASK_KANBAN_STAGE.PM_REVISION_REQUESTED;
  if (task.status === TaskStatus.DONE) return TASK_KANBAN_STAGE.DONE;
  switch (task.reviewStage) {
    case TaskReviewStage.CLIENT_REVIEW:
      return TASK_KANBAN_STAGE.CLIENT_REVIEW;
    case TaskReviewStage.PM_REVISION_REQUESTED:
      return TASK_KANBAN_STAGE.PM_REVISION_REQUESTED;
    case TaskReviewStage.CLIENT_REVISION_REQUESTED:
      return TASK_KANBAN_STAGE.CLIENT_REVISION_REQUESTED;
    case TaskReviewStage.PM_REVIEW:
    case TaskReviewStage.NOT_SUBMITTED:
    default:
      return TASK_KANBAN_STAGE.PM_REVIEW;
  }
}

export function getTaskStatusForKanbanStage(stage: string): TaskStatus {
  switch (stage) {
    case TASK_KANBAN_STAGE.PM_REVIEW:
      return TaskStatus.IN_REVIEW;
    case TASK_KANBAN_STAGE.CLIENT_REVIEW:
      return TaskStatus.CLIENT_REVIEW;
    case TASK_KANBAN_STAGE.PM_REVISION_REQUESTED:
    case TASK_KANBAN_STAGE.CLIENT_REVISION_REQUESTED:
      return TaskStatus.REVISION;
    case TASK_KANBAN_STAGE.TODO:
      return TaskStatus.TODO;
    case TASK_KANBAN_STAGE.IN_PROGRESS:
      return TaskStatus.IN_PROGRESS;
    case TASK_KANBAN_STAGE.DONE:
      return TaskStatus.DONE;
    default:
      return TaskStatus.IN_REVIEW;
  }
}

export function isTaskReviewKanbanStage(stage: string): boolean {
  return (
    stage === TASK_KANBAN_STAGE.PM_REVIEW ||
    stage === TASK_KANBAN_STAGE.CLIENT_REVIEW ||
    stage === TASK_KANBAN_STAGE.PM_REVISION_REQUESTED ||
    stage === TASK_KANBAN_STAGE.CLIENT_REVISION_REQUESTED
  );
}

export const TASK_KANBAN_ORDER: TaskKanbanStage[] = [
  TASK_KANBAN_STAGE.TODO,
  TASK_KANBAN_STAGE.IN_PROGRESS,
  TASK_KANBAN_STAGE.PM_REVIEW,
  TASK_KANBAN_STAGE.CLIENT_REVIEW,
  TASK_KANBAN_STAGE.PM_REVISION_REQUESTED,
  TASK_KANBAN_STAGE.CLIENT_REVISION_REQUESTED,
  TASK_KANBAN_STAGE.DONE,
];

// ── Re-export priority labels for convenience ───────────────────────────────

export const TASK_PRIORITY_LABELS = TASK_PRIORITY_AR;
