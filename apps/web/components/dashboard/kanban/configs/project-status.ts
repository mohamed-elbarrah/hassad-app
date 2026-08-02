import { ProjectStatus } from "@hassad/shared";
import type { KanbanConfig } from "../types";
import { KANBAN_TONES } from "../theme";

/**
 * Project status kanban configuration.
 *
 * Flat layout (no groups).  Each status is a standalone column.
 * Tone classes match PROJECT_STATUS_TONES in lib/utils/project-status.ts.
 */
export const PROJECT_STATUS_CONFIG: KanbanConfig = {
  groups: [],

  stages: {
    [ProjectStatus.PLANNING]: {
      label: "تخطيط",
      ...KANBAN_TONES.neutral,
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.PENDING_ACTIVATION]: {
      label: "بانتظار التفعيل",
      ...KANBAN_TONES.neutral,
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.ACTIVE]: {
      label: "نشط",
      ...KANBAN_TONES.blue,
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.ON_HOLD]: {
      label: "معلق",
      ...KANBAN_TONES.yellow,
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.AWAITING_REVIEW]: {
      label: "بانتظار المراجعة",
      ...KANBAN_TONES.purple,
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.NEEDS_REVISION]: {
      label: "يحتاج تعديل",
      ...KANBAN_TONES.orange,
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.COMPLETED]: {
      label: "مكتمل",
      ...KANBAN_TONES.green,
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.CANCELLED]: {
      label: "ملغي",
      ...KANBAN_TONES.red,
      emptyLabel: "لا يوجد مشاريع",
    },
  },

  stageOrder: [
    ProjectStatus.PLANNING,
    ProjectStatus.PENDING_ACTIVATION,
    ProjectStatus.ACTIVE,
    ProjectStatus.ON_HOLD,
    ProjectStatus.AWAITING_REVIEW,
    ProjectStatus.NEEDS_REVISION,
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED,
  ],
};
