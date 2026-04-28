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
import { PipelineStage } from "@hassad/shared";
import type { LeadListItem } from "@/features/leads/leadsApi";
import {
  useGetLeadsQuery,
  useUpdateLeadStageMutation,
} from "@/features/leads/leadsApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { KanbanGroup } from "./KanbanGroup";

// ─── Error resolver ──────────────────────────────────────────────────────────
function resolveKanbanError(error: unknown): string {
  const e = error as FetchBaseQueryError | undefined;
  if (!e) return "حدث خطأ غير متوقع.";
  if (e.status === 401) return "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.";
  if (e.status === 403) return "لا تملك صلاحية الوصول إلى بيانات العملاء المحتملين.";
  if (typeof e.status === "number" && e.status >= 500)
    return "خطأ في الخادم. يرجى المحاولة لاحقاً.";
  if (e.status === "FETCH_ERROR")
    return "تعذّر الاتصال بالخادم. تحقق من الشبكة.";
  return "فشل تحميل لوحة المبيعات.";
}

// ─── Stage labels ─────────────────────────────────────────────────────────────
const STAGE_LABELS: Record<PipelineStage, string> = {
  [PipelineStage.NEW]: "عميل جديد",
  [PipelineStage.INTRO_SENT]: "تم التواصل",
  [PipelineStage.CALL_ATTEMPT]: "محاولة اتصال",
  [PipelineStage.MEETING_SCHEDULED]: "موعد محدد",
  [PipelineStage.MEETING_DONE]: "تم الاجتماع",
  [PipelineStage.PROPOSAL_SENT]: "تم إرسال العرض",
  [PipelineStage.FOLLOW_UP]: "متابعة",
  [PipelineStage.APPROVED]: "موافقة",
  [PipelineStage.CONTRACT_SIGNED]: "توقيع عقد",
};

// ─── Column colors (header bg + border, dot) ──────────────────────────────────
const STAGE_COLORS: Record<
  PipelineStage,
  { column: string; dot: string }
> = {
  [PipelineStage.NEW]: { column: "bg-slate-50 border-slate-200", dot: "bg-slate-400" },
  [PipelineStage.INTRO_SENT]: { column: "bg-blue-50 border-blue-200", dot: "bg-blue-400" },
  [PipelineStage.CALL_ATTEMPT]: { column: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-400" },
  [PipelineStage.MEETING_SCHEDULED]: { column: "bg-violet-50 border-violet-200", dot: "bg-violet-400" },
  [PipelineStage.MEETING_DONE]: { column: "bg-purple-50 border-purple-200", dot: "bg-purple-400" },
  [PipelineStage.PROPOSAL_SENT]: { column: "bg-amber-50 border-amber-200", dot: "bg-amber-400" },
  [PipelineStage.FOLLOW_UP]: { column: "bg-orange-50 border-orange-200", dot: "bg-orange-400" },
  [PipelineStage.APPROVED]: { column: "bg-yellow-50 border-yellow-200", dot: "bg-yellow-400" },
  [PipelineStage.CONTRACT_SIGNED]: { column: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
};

// ─── Stage groups ─────────────────────────────────────────────────────────────
const KANBAN_GROUPS = [
  {
    id: "acquisition",
    label: "الاستقطاب",
    accentClass: "bg-blue-50 border-blue-200 text-blue-700",
    textClass: "text-blue-700",
    stages: [PipelineStage.NEW, PipelineStage.CALL_ATTEMPT],
  },
  {
    id: "qualification",
    label: "التأهيل",
    accentClass: "bg-violet-50 border-violet-200 text-violet-700",
    textClass: "text-violet-700",
    stages: [
      PipelineStage.INTRO_SENT,
      PipelineStage.MEETING_SCHEDULED,
      PipelineStage.MEETING_DONE,
    ],
  },
  {
    id: "deal",
    label: "العرض والمتابعة",
    accentClass: "bg-amber-50 border-amber-200 text-amber-700",
    textClass: "text-amber-700",
    stages: [PipelineStage.PROPOSAL_SENT, PipelineStage.FOLLOW_UP],
  },
  {
    id: "closing",
    label: "الإغلاق",
    accentClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    textClass: "text-emerald-700",
    stages: [PipelineStage.APPROVED, PipelineStage.CONTRACT_SIGNED],
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export function KanbanBoard() {
  const [activeLead, setActiveLead] = useState<LeadListItem | null>(null);
  const [updateLeadStage] = useUpdateLeadStageMutation();

  const { data, isLoading, isError, error } = useGetLeadsQuery(
    { limit: 100 },
    { pollingInterval: 30_000 },
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Group leads by pipeline stage
  const leadsByStage = useMemo(() => {
    const map = new Map<PipelineStage, LeadListItem[]>();
    Object.values(PipelineStage).forEach((stage) => map.set(stage, []));
    if (data) {
      data.forEach((lead) => {
        const stage = lead.pipelineStage as PipelineStage;
        if (map.has(stage)) {
          map.set(stage, [...(map.get(stage) ?? []), lead]);
        }
      });
    }
    return map;
  }, [data]);

  function handleDragStart(event: DragStartEvent) {
    const leadId = event.active.id as string;
    const lead = data?.find((l) => l.id === leadId) ?? null;
    setActiveLead(lead);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as PipelineStage;
    const currentStage = active.data.current?.stage as PipelineStage;

    if (newStage === currentStage) return;

    try {
      await updateLeadStage({ id: leadId, toStage: newStage }).unwrap();
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل تحديث المرحلة";
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

  const totalLeads = data?.length ?? 0;

  // ── Empty hint (inline, board still renders) ───────────────────────────────
  const emptyBanner = totalLeads === 0 && data !== undefined && (
    <div className="mb-4 rounded-xl border-2 border-dashed px-6 py-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        لا يوجد أي عميل محتمل بعد — سيظهر هنا بعد تقديم طلبات جديدة عبر بوابة العملاء
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
            (sum, stage) => sum + (leadsByStage.get(stage)?.length ?? 0),
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
                  label={STAGE_LABELS[stage]}
                  colorClass={STAGE_COLORS[stage].column}
                  dotClass={STAGE_COLORS[stage].dot}
                  clients={leadsByStage.get(stage) ?? []}
                />
              ))}
            </KanbanGroup>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? <KanbanCard client={activeLead} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
