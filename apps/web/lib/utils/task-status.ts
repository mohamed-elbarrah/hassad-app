/**
 * Centralized task status utilities.
 *
 * Single source of truth for Arabic labels, colors, and kanban layout.
 */
import { TaskStatus, TASK_PRIORITY_AR, type Task } from "@hassad/shared";

// ── Extended task type (includes API relations) ─────────────────────────────

export interface TaskWithMeta extends Task {
  assignee?: { id: string; name: string };
}

// ── Task status colors (distinct per status) ───────────────────────────────
// Each status has a unique color for clear visual differentiation.

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "#6B7280", // Grey - not started
  [TaskStatus.IN_PROGRESS]: "#3B82F6", // Blue - active
  [TaskStatus.IN_REVIEW]: "#8B5CF6", // Purple - waiting review
  [TaskStatus.REVISION]: "#F97316", // Orange - needs fix
  [TaskStatus.DONE]: "#10B981", // Emerald - completed
};

// ── Task status Arabic labels ──────────────────────────────────────────────

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "للتنفيذ",
  [TaskStatus.IN_PROGRESS]: "قيد التنفيذ",
  [TaskStatus.IN_REVIEW]: "قيد المراجعة",
  [TaskStatus.REVISION]: "يحتاج تعديل",
  [TaskStatus.DONE]: "منجز",
};

// ── Kanban order (left to right flow) ───────────────────────────────────────

export const TASK_KANBAN_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.REVISION,
  TaskStatus.DONE,
];

// ── Re-export priority labels for convenience ───────────────────────────────

export const TASK_PRIORITY_LABELS = TASK_PRIORITY_AR;
