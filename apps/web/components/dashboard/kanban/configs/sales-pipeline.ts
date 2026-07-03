import { RequestStatus } from "@hassad/shared";
import type { KanbanConfig } from "../types";

/**
 * Sales pipeline kanban configuration.
 *
 * Groups: الاستقبال والتأهيل → العرض والتفاوض → العقد → التوقيع والتحويل
 * Stages map 1:1 to RequestStatus enum values.
 */
export const SALES_PIPELINE_CONFIG: KanbanConfig = {
  groups: [
    {
      id: "intake",
      label: "الاستقبال والتأهيل",
      stages: [RequestStatus.SUBMITTED, RequestStatus.QUALIFYING],
    },
    {
      id: "proposal",
      label: "العرض والتفاوض",
      stages: [
        RequestStatus.PROPOSAL_IN_PROGRESS,
        RequestStatus.PROPOSAL_SENT,
        RequestStatus.NEGOTIATION,
      ],
    },
    {
      id: "contract",
      label: "العقد",
      stages: [
        RequestStatus.CONTRACT_PREPARATION,
        RequestStatus.CONTRACT_SENT,
      ],
    },
    {
      id: "handoff",
      label: "التوقيع والتحويل",
      stages: [
        RequestStatus.SIGNED,
        RequestStatus.PROJECT_CREATED,
        RequestStatus.CANCELLED,
      ],
    },
  ],

  stages: {
    [RequestStatus.SUBMITTED]: {
      label: "طلب جديد",
      dotColor: "#64748B",
      bandBg: "#E2E8F0",
      surfaceBg: "#F1F5F9",
      countText: "#475569",
      countBg: "#CBD5E1",
      emptyLabel: "لا يوجد عملاء",
    },
    [RequestStatus.QUALIFYING]: {
      label: "مراجعة المبيعات",
      dotColor: "#6366F1",
      bandBg: "#C7D2FE",
      surfaceBg: "#EEF2FF",
      countText: "#4338CA",
      countBg: "#A5B4FC",
      emptyLabel: "لا يوجد عملاء",
    },
    [RequestStatus.PROPOSAL_IN_PROGRESS]: {
      label: "إعداد العرض",
      dotColor: "#3B82F6",
      bandBg: "#BFDBFE",
      surfaceBg: "#EFF6FF",
      countText: "#1D4ED8",
      countBg: "#93C5FD",
      emptyLabel: "لا يوجد عملاء",
    },
    [RequestStatus.PROPOSAL_SENT]: {
      label: "تم إرسال العرض",
      dotColor: "#D97706",
      bandBg: "#FDE68A",
      surfaceBg: "#FFFBEB",
      countText: "#92400E",
      countBg: "#FCD34D",
      emptyLabel: "لا يوجد عملاء",
    },
    [RequestStatus.NEGOTIATION]: {
      label: "تفاوض",
      dotColor: "#EA580C",
      bandBg: "#FED7AA",
      surfaceBg: "#FFF7ED",
      countText: "#9A3412",
      countBg: "#FDBA74",
      emptyLabel: "لا يوجد عملاء",
    },
    [RequestStatus.CONTRACT_PREPARATION]: {
      label: "إعداد العقد",
      dotColor: "#8B5CF6",
      bandBg: "#DDD6FE",
      surfaceBg: "#F5F3FF",
      countText: "#6D28D9",
      countBg: "#C4B5FD",
      emptyLabel: "لا يوجد عملاء",
    },
    [RequestStatus.CONTRACT_SENT]: {
      label: "العقد مرسل",
      dotColor: "#0891B2",
      bandBg: "#CFFAFE",
      surfaceBg: "#ECFEFF",
      countText: "#155E75",
      countBg: "#67E8F9",
      emptyLabel: "لا يوجد عملاء",
    },
    [RequestStatus.SIGNED]: {
      label: "تم التوقيع",
      dotColor: "#059669",
      bandBg: "#A7F3D0",
      surfaceBg: "#ECFDF5",
      countText: "#065F46",
      countBg: "#6EE7B7",
      emptyLabel: "لا يوجد عملاء",
    },
    [RequestStatus.PROJECT_CREATED]: {
      label: "تحول إلى مشروع",
      dotColor: "#16A34A",
      bandBg: "#86EFAC",
      surfaceBg: "#DCFCE7",
      countText: "#14532D",
      countBg: "#4ADE80",
      emptyLabel: "لا يوجد عملاء",
    },
    [RequestStatus.CANCELLED]: {
      label: "ملغي",
      dotColor: "#DC2626",
      bandBg: "#FECACA",
      surfaceBg: "#FEF2F2",
      countText: "#991B1B",
      countBg: "#FCA5A5",
      emptyLabel: "لا يوجد عملاء",
    },
  },

  stageOrder: [
    RequestStatus.SUBMITTED,
    RequestStatus.QUALIFYING,
    RequestStatus.PROPOSAL_IN_PROGRESS,
    RequestStatus.PROPOSAL_SENT,
    RequestStatus.NEGOTIATION,
    RequestStatus.CONTRACT_PREPARATION,
    RequestStatus.CONTRACT_SENT,
    RequestStatus.SIGNED,
    RequestStatus.PROJECT_CREATED,
    RequestStatus.CANCELLED,
  ],
};
