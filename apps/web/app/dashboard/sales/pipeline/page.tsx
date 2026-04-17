"use client";

import { KanbanBoard } from "@/components/dashboard/crm/KanbanBoard";

export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">لوحة خط المبيعات</h1>
      </div>
      <KanbanBoard />
    </div>
  );
}
