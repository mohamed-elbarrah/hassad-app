import type { KanbanConfig } from "../types";
import { KANBAN_TONES } from "../theme";
import {
  TASK_KANBAN_ORDER,
  TASK_KANBAN_STAGE,
  TASK_KANBAN_STAGE_LABELS,
} from "@/lib/utils/task-status";

export const TASK_STATUS_CONFIG: KanbanConfig = {
  groups: [],
  stages: {
    [TASK_KANBAN_STAGE.TODO]: {
      label: TASK_KANBAN_STAGE_LABELS.TODO,
      ...KANBAN_TONES.neutral,
      emptyLabel: "لا توجد مهام",
    },
    [TASK_KANBAN_STAGE.IN_PROGRESS]: {
      label: TASK_KANBAN_STAGE_LABELS.IN_PROGRESS,
      ...KANBAN_TONES.blue,
      emptyLabel: "لا توجد مهام",
    },
    [TASK_KANBAN_STAGE.PM_REVIEW]: {
      label: TASK_KANBAN_STAGE_LABELS.PM_REVIEW,
      ...KANBAN_TONES.purple,
      emptyLabel: "لا توجد مهام",
    },
    [TASK_KANBAN_STAGE.CLIENT_REVIEW]: {
      label: TASK_KANBAN_STAGE_LABELS.CLIENT_REVIEW,
      ...KANBAN_TONES.blue,
      emptyLabel: "لا توجد مهام",
    },
    [TASK_KANBAN_STAGE.PM_REVISION_REQUESTED]: {
      label: TASK_KANBAN_STAGE_LABELS.PM_REVISION_REQUESTED,
      ...KANBAN_TONES.orange,
      emptyLabel: "لا توجد مهام",
    },
    [TASK_KANBAN_STAGE.CLIENT_REVISION_REQUESTED]: {
      label: TASK_KANBAN_STAGE_LABELS.CLIENT_REVISION_REQUESTED,
      ...KANBAN_TONES.orange,
      emptyLabel: "لا توجد مهام",
    },
    [TASK_KANBAN_STAGE.DONE]: {
      label: TASK_KANBAN_STAGE_LABELS.DONE,
      ...KANBAN_TONES.green,
      emptyLabel: "لا توجد مهام",
    },
  },
  stageOrder: TASK_KANBAN_ORDER,
};
