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

const STATUS_COLORS: Record<RequestStatus, { column: string; dot: string }> = {
  [RequestStatus.SUBMITTED]: {
    column: "bg-slate-50 border-slate-200",
    dot: "bg-slate-400",
  },
  [RequestStatus.QUALIFYING]: {
    column: "bg-blue-50 border-blue-200",
    dot: "bg-blue-400",
  },
  [RequestStatus.PROPOSAL_IN_PROGRESS]: {
    column: "bg-violet-50 border-violet-200",
    dot: "bg-violet-400",
  },
  [RequestStatus.PROPOSAL_SENT]: {
    column: "bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
  },
  [RequestStatus.NEGOTIATION]: {
    column: "bg-orange-50 border-orange-200",
    dot: "bg-orange-400",
  },
  [RequestStatus.CONTRACT_PREPARATION]: {
    column: "bg-yellow-50 border-yellow-200",
    dot: "bg-yellow-400",
  },
  [RequestStatus.CONTRACT_SENT]: {
    column: "bg-lime-50 border-lime-200",
    dot: "bg-lime-500",
  },
  [RequestStatus.SIGNED]: {
    column: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  [RequestStatus.PROJECT_CREATED]: {
    column: "bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
  },
  [RequestStatus.CANCELLED]: {
    column: "bg-rose-50 border-rose-200",
    dot: "bg-rose-500",
  },
};

const KANBAN_GROUPS = [
  {
    id: "intake",
    label: "الاستقبال والتأهيل",
    accentClass: "bg-blue-50 border-blue-200 text-blue-700",
    textClass: "text-blue-700",
    stages: [RequestStatus.SUBMITTED, RequestStatus.QUALIFYING],
  },
  {
    id: "proposal",
    label: "العرض والتفاوض",
    accentClass: "bg-violet-50 border-violet-200 text-violet-700",
    textClass: "text-violet-700",
    stages: [
      RequestStatus.PROPOSAL_IN_PROGRESS,
      RequestStatus.PROPOSAL_SENT,
      RequestStatus.NEGOTIATION,
    ],
  },
  {
    id: "contract",
    label: "العقد",
    accentClass: "bg-amber-50 border-amber-200 text-amber-700",
    textClass: "text-amber-700",
    stages: [RequestStatus.CONTRACT_PREPARATION, RequestStatus.CONTRACT_SENT],
  },
  {
    id: "handoff",
    label: "التوقيع والتحويل",
    accentClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    textClass: "text-emerald-700",
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
      <div className="space-y-4">
        {KANBAN_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2">
            <div className="h-10 bg-muted animate-pulse rounded-lg" />
            <div className="flex gap-3">
              {group.stages.map((stage) => (
                <div
                  key={stage}
                  className="w-72 shrink-0 h-48 bg-muted animate-pulse rounded-xl"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-destructive font-medium">
          {resolveKanbanError(error)}
        </p>
      </div>
    );
  }

  const totalRequests = data?.length ?? 0;

  const emptyBanner = totalRequests === 0 && data !== undefined && (
    <div className="mb-4 rounded-xl border-2 border-dashed px-6 py-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">
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
      <div className="space-y-5" dir="rtl">
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
              accentClass={group.accentClass}
              textClass={group.textClass}
              totalCount={groupCount}
            >
              {group.stages.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  label={STATUS_LABELS[stage]}
                  colorClass={STATUS_COLORS[stage].column}
                  dotClass={STATUS_COLORS[stage].dot}
                  clients={requestsByStatus.get(stage) ?? []}
                />
              ))}
            </KanbanGroup>
          );
        })}
      </div>

      <DragOverlay>
        {activeRequest ? <KanbanCard client={activeRequest} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
