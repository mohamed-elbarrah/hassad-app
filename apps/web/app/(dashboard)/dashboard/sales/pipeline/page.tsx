import Link from "next/link";
import { KanbanBoard } from "@/components/dashboard/crm/KanbanBoard";
import { ActionButton } from "@/components/design-system/ActionButton";

export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold tracking-tight">لوحة خط المبيعات</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <ActionButton
            variant="outline"
            size="sm"
            href="/dashboard/sales/proposals"
          >
            العروض الفنية
          </ActionButton>
          <ActionButton
            variant="outline"
            size="sm"
            href="/dashboard/sales/contracts"
          >
            العقود
          </ActionButton>
        </div>
      </div>

      {/* ── Kanban board ─────────────────────────────────────────────── */}
      <KanbanBoard />
    </div>
  );
}
