"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { RequestStatus } from "@hassad/shared";
import type { RequestItem } from "@/features/requests/requestsApi";
import {
  useGetRequestsQuery,
  useUpdateRequestStatusMutation,
} from "@/features/requests/requestsApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { KanbanGroup } from "./KanbanGroup";

// ─── Error resolver ──────────────────────────────────────────────────────────
function resolveKanbanError(error: unknown): string {
  const e = error as FetchBaseQueryError | undefined;
  if (!e) return "حدث خطأ غير متوقع.";
  if (e.status === 401) return "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.";
  if (e.status === 403) return "لا تملك صلاحية الوصول إلى بيانات الطلبات.";
  if (typeof e.status === "number" && e.status >= 500)
    return "خطأ في الخادم. يرجى المحاولة لاحقاً.";
  if (e.status === "FETCH_ERROR")
    return "تعذّر الاتصال بالخادم. تحقق من الشبكة.";
  return "فشل تحميل لوحة الطلبات.";
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  [RequestStatus.SUBMITTED]: "طلب جديد",
  [RequestStatus.QUALIFYING]: "مراجعة المبيعات",
  [RequestStatus.PROPOSAL_IN_PROGRESS]: "إعداد العرض",
  [RequestStatus.PROPOSAL_SENT]: "تم إرسال العرض",
  [RequestStatus.NEGOTIATION]: "تفاوض",
  [RequestStatus.CONTRACT_PREPARATION]: "إعداد العقد",
  [RequestStatus.CONTRACT_SENT]: "العقد مرسل",
  [RequestStatus.SIGNED]: "تم التوقيع",
  [RequestStatus.PROJECT_CREATED]: "تحول إلى مشروع",
  [RequestStatus.CANCELLED]: "ملغي",
};

/* ── Bright, semantic, unique color per stage ──────────────────────────────── */
const STATUS_THEME: Record<
  RequestStatus,
  {
    dot: string;
    bandBg: string;
    surfaceBg: string;
    cardBorder: string;
    countText: string;
    countBg: string;
  }
> = {
  [RequestStatus.SUBMITTED]: {
    dot: "#64748B",
    bandBg: "#E2E8F0",
    surfaceBg: "#F1F5F9",
    cardBorder: "#94A3B8",
    countText: "#475569",
    countBg: "#CBD5E1",
  },
  [RequestStatus.QUALIFYING]: {
    dot: "#6366F1",
    bandBg: "#C7D2FE",
    surfaceBg: "#EEF2FF",
    cardBorder: "#818CF8",
    countText: "#4338CA",
    countBg: "#A5B4FC",
  },
  [RequestStatus.PROPOSAL_IN_PROGRESS]: {
    dot: "#3B82F6",
    bandBg: "#BFDBFE",
    surfaceBg: "#EFF6FF",
    cardBorder: "#60A5FA",
    countText: "#1D4ED8",
    countBg: "#93C5FD",
  },
  [RequestStatus.PROPOSAL_SENT]: {
    dot: "#D97706",
    bandBg: "#FDE68A",
    surfaceBg: "#FFFBEB",
    cardBorder: "#FBBF24",
    countText: "#92400E",
    countBg: "#FCD34D",
  },
  [RequestStatus.NEGOTIATION]: {
    dot: "#EA580C",
    bandBg: "#FED7AA",
    surfaceBg: "#FFF7ED",
    cardBorder: "#FB923C",
    countText: "#9A3412",
    countBg: "#FDBA74",
  },
  [RequestStatus.CONTRACT_PREPARATION]: {
    dot: "#8B5CF6",
    bandBg: "#DDD6FE",
    surfaceBg: "#F5F3FF",
    cardBorder: "#A78BFA",
    countText: "#6D28D9",
    countBg: "#C4B5FD",
  },
  [RequestStatus.CONTRACT_SENT]: {
    dot: "#0891B2",
    bandBg: "#CFFAFE",
    surfaceBg: "#ECFEFF",
    cardBorder: "#22D3EE",
    countText: "#155E75",
    countBg: "#67E8F9",
  },
  [RequestStatus.SIGNED]: {
    dot: "#059669",
    bandBg: "#A7F3D0",
    surfaceBg: "#ECFDF5",
    cardBorder: "#34D399",
    countText: "#065F46",
    countBg: "#6EE7B7",
  },
  [RequestStatus.PROJECT_CREATED]: {
    dot: "#16A34A",
    bandBg: "#86EFAC",
    surfaceBg: "#DCFCE7",
    cardBorder: "#4ADE80",
    countText: "#14532D",
    countBg: "#4ADE80",
  },
  [RequestStatus.CANCELLED]: {
    dot: "#DC2626",
    bandBg: "#FECACA",
    surfaceBg: "#FEF2F2",
    cardBorder: "#F87171",
    countText: "#991B1B",
    countBg: "#FCA5A5",
  },
};

/* ── Group definitions ──────────────────────────────────────────────────────── */
const KANBAN_GROUPS = [
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
    stages: [RequestStatus.CONTRACT_PREPARATION, RequestStatus.CONTRACT_SENT],
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
] as const;

export function KanbanBoard() {
  const [activeRequest, setActiveRequest] = useState<RequestItem | null>(null);
  const [updateRequestStatus] = useUpdateRequestStatusMutation();

  const { data, isLoading, isError, error } = useGetRequestsQuery(
    { limit: 100 },
    { pollingInterval: 30_000 },
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const requestsByStatus = useMemo(() => {
    const map = new Map<RequestStatus, RequestItem[]>();
    Object.values(RequestStatus).forEach((status) => map.set(status, []));
    if (data) {
      data.forEach((request) => {
        const status = request.status as RequestStatus;
        if (map.has(status)) {
          map.set(status, [...(map.get(status) ?? []), request]);
        }
      });
    }
    return map;
  }, [data]);

  function handleDragStart(event: DragStartEvent) {
    const requestId = event.active.id as string;
    const request = data?.find((item) => item.id === requestId) ?? null;
    setActiveRequest(request);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveRequest(null);
    if (!over) return;

    const requestId = active.id as string;
    const newStatus = over.id as RequestStatus;
    const currentStatus = active.data.current?.status as RequestStatus;

    if (newStatus === currentStatus) return;

    try {
      await updateRequestStatus({
        id: requestId,
        toStatus: newStatus,
      }).unwrap();
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل تحديث حالة الطلب";
      toast.error(message);
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex gap-6 h-full" dir="rtl">
        {KANBAN_GROUPS.map((group) => (
          <div
            key={group.id}
            className="flex-1 min-w-[340px] rounded-2xl border-[1.5px] border-portal-card-border p-3 space-y-3 bg-white"
          >
            <div className="h-8 bg-white animate-pulse rounded-xl border border-portal-card-border" />
            <div className="space-y-2">
              {group.stages.map((stage) => (
                <div
                  key={stage}
                  className="h-36 bg-white animate-pulse rounded-2xl border border-portal-card-border"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-danger-500 font-medium">
          {resolveKanbanError(error)}
        </p>
      </div>
    );
  }

  const totalRequests = data?.length ?? 0;

  const emptyBanner = totalRequests === 0 && data !== undefined && (
    <div className="mb-4 rounded-2xl border-[1.5px] border-dashed border-portal-card-border px-6 py-4 text-center bg-white">
      <p className="text-sm font-medium text-portal-note-text">
        لا يوجد أي طلب بعد — سيظهر هنا بعد تقديم طلبات جديدة عبر بوابة العملاء
      </p>
    </div>
  );

  // ── Board ──────────────────────────────────────────────────────────────────
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-2 h-full" dir="rtl">
        {emptyBanner}
        {KANBAN_GROUPS.map((group) => {
          const groupCount = group.stages.reduce(
            (sum, stage) => sum + (requestsByStatus.get(stage)?.length ?? 0),
            0,
          );

          return (
            <KanbanGroup
              key={group.id}
              id={group.id}
              label={group.label}
              totalCount={groupCount}
            >
              {group.stages.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  label={STATUS_LABELS[stage]}
                  theme={STATUS_THEME[stage]}
                  clients={requestsByStatus.get(stage) ?? []}
                />
              ))}
            </KanbanGroup>
          );
        })}
      </div>

      <DragOverlay>
        {activeRequest ? (
          <KanbanCard
            client={activeRequest}
            isOverlay
            accentColor={STATUS_THEME[activeRequest.status as RequestStatus]?.cardBorder}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
