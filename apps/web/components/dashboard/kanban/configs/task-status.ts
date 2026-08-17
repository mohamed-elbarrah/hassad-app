import { TaskStatus } from "@hassad/shared";
import type { KanbanConfig } from "../types";
import { KANBAN_TONES } from "../theme";

/**
 * Task status kanban configuration.
 *
 * Flat layout (no groups).  Each status is a standalone column.
 * Tone classes match TASK_STATUS_TONES in lib/utils/task-status.ts.
 */
export const TASK_STATUS_CONFIG: KanbanConfig = {
  groups: [],

  stages: {
    [TaskStatus.TODO]: {
      label: "للتنفيذ",
      ...KANBAN_TONES.neutral,
      emptyLabel: "لا توجد مهام",
    },
    [TaskStatus.IN_PROGRESS]: {
      label: "قيد التنفيذ",
      ...KANBAN_TONES.blue,
      emptyLabel: "لا توجد مهام",
    },
    [TaskStatus.IN_REVIEW]: {
      label: "قيد المراجعة",
      ...KANBAN_TONES.purple,
      emptyLabel: "لا توجد مهام",
    },
    [TaskStatus.REVISION]: {
      label: "يحتاج تعديل",
      ...KANBAN_TONES.orange,
      emptyLabel: "لا توجد مهام",
    },
    [TaskStatus.DONE]: {
      label: "منجز",
      ...KANBAN_TONES.green,
      emptyLabel: "لا توجد مهام",
    },
  },

  stageOrder: [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.REVISION,
    TaskStatus.DONE,
  ],
};
