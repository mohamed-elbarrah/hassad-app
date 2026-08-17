/**
 * Centralized task status utilities.
 *
 * Single source of truth for Arabic labels, tone classes, and kanban layout.
 */
import { TaskStatus, TASK_PRIORITY_AR, type Task } from "@hassad/shared";
import { KANBAN_TONES, type KanbanToneClasses } from "@/components/dashboard/kanban/theme";

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
  [TaskStatus.REVISION]: KANBAN_TONES.orange,
  [TaskStatus.DONE]: KANBAN_TONES.green,
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
