"use client";

import { Ticket, Plus } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";

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
    <div
      className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
        <Ticket className="h-8 w-8 text-secondary-500" />
      </div>
      <p className="text-lg font-medium text-natural-100">
        {hasFilter ? "لا توجد تذاكر تطابق بحثك" : "لا توجد تذاكر نزاع"}
      </p>
      <p className="max-w-md text-sm leading-6 text-portal-note-text">
        {hasFilter
          ? "حاول تغيير الفلتر لعرض نتائج أكثر."
          : "ستظهر هنا جميع تذاكر النزاع الخاصة بك. يمكنك فتح تذكرة جديدة إذا كان لديك مشكلة مع أحد مشاريعك."}
      </p>
      {canCreate && onCreateNew && !hasFilter && (
        <ActionButton
          variant="primary"
          size="sm"
          onClick={onCreateNew}
          className="mt-2 h-10 rounded-xl px-6 gap-2"
        >
          <Plus className="h-4 w-4" />
          فتح تذكرة جديدة
        </ActionButton>
      )}
    </div>
  );
}
