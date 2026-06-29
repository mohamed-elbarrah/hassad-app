"use client";

import { Ticket } from "lucide-react";
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";

interface DisputeEmptyStateProps {
  hasFilter?: boolean;
  onCreateNew?: () => void;
  canCreate?: boolean;
}

export function DisputeEmptyState({
  hasFilter = false,
  onCreateNew,
  canCreate = true,
}: DisputeEmptyStateProps) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
      <PortalEmptyState
        icon={Ticket}
        title={hasFilter ? "لا توجد تذاكر تطابق بحثك" : "لا توجد تذاكر نزاع"}
        description={hasFilter ? "حاول تغيير الفلتر لعرض نتائج أكثر." : "ستظهر هنا جميع تذاكر النزاع الخاصة بك. يمكنك فتح تذكرة جديدة إذا كان لديك مشكلة مع أحد مشاريعك."}
        actionLabel={canCreate && onCreateNew && !hasFilter ? "فتح تذكرة جديدة" : undefined}
        onAction={canCreate && onCreateNew && !hasFilter ? onCreateNew : undefined}
      />
    </div>
  );
}
