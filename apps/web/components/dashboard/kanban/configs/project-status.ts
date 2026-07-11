import { ProjectStatus } from "@hassad/shared";
import type { KanbanConfig } from "../types";

/**
 * Project status kanban configuration.
 *
 * Flat layout (no groups).  Each status is a standalone column.
 * Colours match PROJECT_STATUS_COLOR in lib/utils/project-status.ts.
 */
export const PROJECT_STATUS_CONFIG: KanbanConfig = {
  groups: [],

  stages: {
    [ProjectStatus.PLANNING]: {
      label: "تخطيط",
      dotColor: "#6B7280",
      bandBg: "#F3F4F6",
      surfaceBg: "#F9FAFB",
      countText: "#4B5563",
      countBg: "#E5E7EB",
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.PENDING_ACTIVATION]: {
      label: "بانتظار التفعيل",
      dotColor: "#94A3B8",
      bandBg: "#F1F5F9",
      surfaceBg: "#F8FAFC",
      countText: "#475569",
      countBg: "#CBD5E1",
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.ACTIVE]: {
      label: "نشط",
      dotColor: "#3B82F6",
      bandBg: "#BFDBFE",
      surfaceBg: "#EFF6FF",
      countText: "#1D4ED8",
      countBg: "#93C5FD",
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.ON_HOLD]: {
      label: "معلق",
      dotColor: "#F59E0B",
      bandBg: "#FDE68A",
      surfaceBg: "#FFFBEB",
      countText: "#92400E",
      countBg: "#FCD34D",
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.AWAITING_REVIEW]: {
      label: "بانتظار المراجعة",
      dotColor: "#8B5CF6",
      bandBg: "#DDD6FE",
      surfaceBg: "#F5F3FF",
      countText: "#6D28D9",
      countBg: "#C4B5FD",
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.NEEDS_REVISION]: {
      label: "يحتاج تعديل",
      dotColor: "#F97316",
      bandBg: "#FED7AA",
      surfaceBg: "#FFF7ED",
      countText: "#9A3412",
      countBg: "#FDBA74",
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.COMPLETED]: {
      label: "مكتمل",
      dotColor: "#10B981",
      bandBg: "#A7F3D0",
      surfaceBg: "#ECFDF5",
      countText: "#065F46",
      countBg: "#6EE7B7",
      emptyLabel: "لا يوجد مشاريع",
    },
    [ProjectStatus.CANCELLED]: {
      label: "ملغي",
      dotColor: "#EF4444",
      bandBg: "#FECACA",
      surfaceBg: "#FEF2F2",
      countText: "#991B1B",
      countBg: "#FCA5A5",
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
