import { TaskStatus } from "@hassad/shared";
import type { KanbanConfig } from "../types";

/**
 * Task status kanban configuration.
 *
 * Flat layout (no groups).  Each status is a standalone column.
 * Colours match TASK_STATUS_COLOR in lib/utils/task-status.ts.
 */
export const TASK_STATUS_CONFIG: KanbanConfig = {
  groups: [],

  stages: {
    [TaskStatus.TODO]: {
      label: "للتنفيذ",
      dotColor: "#6B7280",
      bandBg: "#F3F4F6",
      surfaceBg: "#F9FAFB",
      countText: "#4B5563",
      countBg: "#E5E7EB",
      emptyLabel: "لا توجد مهام",
    },
    [TaskStatus.IN_PROGRESS]: {
      label: "قيد التنفيذ",
      dotColor: "#3B82F6",
      bandBg: "#BFDBFE",
      surfaceBg: "#EFF6FF",
      countText: "#1D4ED8",
      countBg: "#93C5FD",
      emptyLabel: "لا توجد مهام",
    },
    [TaskStatus.IN_REVIEW]: {
      label: "قيد المراجعة",
      dotColor: "#8B5CF6",
      bandBg: "#DDD6FE",
      surfaceBg: "#F5F3FF",
      countText: "#6D28D9",
      countBg: "#C4B5FD",
      emptyLabel: "لا توجد مهام",
    },
    [TaskStatus.REVISION]: {
      label: "يحتاج تعديل",
      dotColor: "#F97316",
      bandBg: "#FED7AA",
      surfaceBg: "#FFF7ED",
      countText: "#9A3412",
      countBg: "#FDBA74",
      emptyLabel: "لا توجد مهام",
    },
    [TaskStatus.DONE]: {
      label: "منجز",
      dotColor: "#10B981",
      bandBg: "#A7F3D0",
      surfaceBg: "#ECFDF5",
      countText: "#065F46",
      countBg: "#6EE7B7",
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
