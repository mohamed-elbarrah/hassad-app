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
import type { Client } from "@hassad/shared";
import {
  useGetClientsQuery,
  useUpdateClientStageMutation,
} from "@/features/clients/clientsApi";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { HandoverModal } from "./HandoverModal";

const STAGE_LABELS: Record<PipelineStage, string> = {
  [PipelineStage.NEW_LEAD]: "عميل جديد",
  [PipelineStage.CONTACTED]: "تم التواصل",
  [PipelineStage.MEETING_SCHEDULED]: "اجتماع محدد",
  [PipelineStage.REQUIREMENTS_GATHERING]: "جمع المتطلبات",
  [PipelineStage.PROPOSAL_SENT]: "تم إرسال العرض",
  [PipelineStage.NEGOTIATION]: "التفاوض",
  [PipelineStage.WAITING_FOR_SIGNATURE]: "بانتظار التوقيع",
  [PipelineStage.CONTRACTED_WON]: "تم التعاقد",
  [PipelineStage.HANDOVER]: "تسليم للعمليات",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  [PipelineStage.NEW_LEAD]: "bg-slate-50 border-slate-300",
  [PipelineStage.CONTACTED]: "bg-blue-50 border-blue-300",
  [PipelineStage.MEETING_SCHEDULED]: "bg-indigo-50 border-indigo-300",
  [PipelineStage.REQUIREMENTS_GATHERING]: "bg-violet-50 border-violet-300",
  [PipelineStage.PROPOSAL_SENT]: "bg-amber-50 border-amber-300",
  [PipelineStage.NEGOTIATION]: "bg-orange-50 border-orange-300",
  [PipelineStage.WAITING_FOR_SIGNATURE]: "bg-yellow-50 border-yellow-300",
  [PipelineStage.CONTRACTED_WON]: "bg-emerald-50 border-emerald-300",
  [PipelineStage.HANDOVER]: "bg-green-50 border-green-300",
};

export function KanbanBoard() {
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [pendingHandover, setPendingHandover] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [updateStage] = useUpdateClientStageMutation();

  const { data, isLoading, isError } = useGetClientsQuery({ limit: 100 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const clientsByStage = useMemo(() => {
    const map = new Map<PipelineStage, Client[]>();
    PIPELINE_STAGE_ORDER.forEach((stage) => map.set(stage, []));
    if (data?.items) {
      data.items.forEach((client) => {
        const stage = client.stage as PipelineStage;
        const list = map.get(stage) ?? [];
        map.set(stage, [...list, client]);
      });
    }
    return map;
  }, [data]);

  function handleDragStart(event: DragStartEvent) {
    const clientId = event.active.id as string;
    const client = data?.items.find((c) => c.id === clientId) ?? null;
    setActiveClient(client);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveClient(null);
    if (!over) return;

    const clientId = active.id as string;
    const newStage = over.id as PipelineStage;
    const currentStage = active.data.current?.stage as PipelineStage;

    if (newStage === currentStage) return;

    // Intercept HANDOVER — show the modal instead of calling the stage mutation
    if (newStage === PipelineStage.HANDOVER) {
      const client = data?.items.find((c) => c.id === clientId);
      setPendingHandover({ id: clientId, name: client?.name ?? clientId });
      return;
    }

    try {
      await updateStage({ id: clientId, body: { stage: newStage } }).unwrap();
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
        <p className="text-destructive font-medium">فشل تحميل لوحة المبيعات</p>
        <p className="text-sm text-muted-foreground">
          تحقق من الاتصال بالخادم وأعد المحاولة
        </p>
      </div>
    );
  }

  const totalClients = data?.total ?? 0;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {totalClients === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3 border-2 border-dashed rounded-xl">
            <p className="text-lg font-medium text-muted-foreground">
              لا يوجد أي عميل بعد
            </p>
            <p className="text-sm text-muted-foreground">
              أضف أول عميل من صفحة المبيعات أو عبر رابط التسجيل
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
                  clients={clientsByStage.get(stage) ?? []}
                />
              ))}
            </div>
          </div>
        )}

        <DragOverlay>
          {activeClient ? <KanbanCard client={activeClient} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {pendingHandover && (
        <HandoverModal
          open
          client={pendingHandover}
          onClose={() => setPendingHandover(null)}
        />
      )}
    </>
  );
}
