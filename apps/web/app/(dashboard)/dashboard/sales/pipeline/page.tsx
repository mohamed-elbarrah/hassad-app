import { KanbanBoard } from "@/components/dashboard/crm/KanbanBoard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">لوحة خط المبيعات</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/sales/proposals">العروض الفنية</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/sales/contracts">العقود</Link>
          </Button>
        </div>
      </div>

      {/* ── Kanban board ─────────────────────────────────────────────── */}
      <KanbanBoard />
    </div>
  );
}
