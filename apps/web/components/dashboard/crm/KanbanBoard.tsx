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
import { PipelineStage, PIPELINE_STAGE_ORDER } from "@hassad/shared";
import type { LeadListItem } from "@/features/leads/leadsApi";
import {
  useGetLeadsQuery,
  useUpdateLeadStageMutation,
} from "@/features/leads/leadsApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

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

const STAGE_COLORS: Record<PipelineStage, string> = {
  [PipelineStage.NEW]: "bg-slate-50 border-slate-300",
  [PipelineStage.INTRO_SENT]: "bg-blue-50 border-blue-300",
  [PipelineStage.CALL_ATTEMPT]: "bg-indigo-50 border-indigo-300",
  [PipelineStage.MEETING_SCHEDULED]: "bg-violet-50 border-violet-300",
  [PipelineStage.MEETING_DONE]: "bg-purple-50 border-purple-300",
  [PipelineStage.PROPOSAL_SENT]: "bg-amber-50 border-amber-300",
  [PipelineStage.FOLLOW_UP]: "bg-orange-50 border-orange-300",
  [PipelineStage.APPROVED]: "bg-yellow-50 border-yellow-300",
  [PipelineStage.CONTRACT_SIGNED]: "bg-emerald-50 border-emerald-300",
};

export function KanbanBoard() {
  const [activeLead, setActiveLead] = useState<LeadListItem | null>(null);
  const [updateLeadStage] = useUpdateLeadStageMutation();

  const { data, isLoading, isError, error } = useGetLeadsQuery({ limit: 100 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const leadsByStage = useMemo(() => {
    const map = new Map<PipelineStage, LeadListItem[]>();
    PIPELINE_STAGE_ORDER.forEach((stage) => map.set(stage, []));
    if (data?.items) {
      data.items.forEach((lead) => {
        const stage = lead.pipelineStage as PipelineStage;
        if (map.has(stage)) {
          const list = map.get(stage)!;
          map.set(stage, [...list, lead]);
        }
      });
    }
    return map;
  }, [data]);

  function handleDragStart(event: DragStartEvent) {
    const leadId = event.active.id as string;
    const lead = data?.items.find((l) => l.id === leadId) ?? null;
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

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGE_ORDER.map((stage) => (
          <div
            key={stage}
            className="w-64 shrink-0 h-96 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-destructive font-medium">
          {resolveKanbanError(error)}
        </p>
      </div>
    );
  }

  const totalLeads = data?.total ?? 0;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {totalLeads === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3 border-2 border-dashed rounded-xl">
            <p className="text-lg font-medium text-muted-foreground">
              لا يوجد أي عميل محتمل بعد
            </p>
            <p className="text-sm text-muted-foreground">
              أضف أول عميل محتمل من صفحة العملاء المحتملين
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4" dir="rtl">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGE_ORDER.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  label={STAGE_LABELS[stage]}
                  colorClass={STAGE_COLORS[stage]}
                  clients={leadsByStage.get(stage) ?? []}
                />
              ))}
            </div>
          </div>
        )}

        <DragOverlay>
          {activeLead ? <KanbanCard client={activeLead} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
