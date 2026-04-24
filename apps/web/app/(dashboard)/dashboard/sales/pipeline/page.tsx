"use client";

import { KanbanBoard } from "@/components/dashboard/crm/KanbanBoard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">لوحة خط المبيعات</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/sales/proposals">العروض الفنية</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/sales/contracts">العقود</Link>
          </Button>
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
}
