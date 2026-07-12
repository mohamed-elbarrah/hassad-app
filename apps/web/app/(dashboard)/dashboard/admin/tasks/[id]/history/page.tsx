"use client";

import { use } from "react";
import { History } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminTaskByIdQuery } from "@/features/admin/adminTasksApi";
import { TASK_STATUS_AR } from "@hassad/shared";
import { cn } from "@/lib/utils";

export default function TaskHistoryTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: task } = useGetAdminTaskByIdQuery(id);

  if (!task) return null;

  if (!task.statusHistory.length) {
    return (
      <AdminEmptyState
        icon={History}
        title="لا يوجد سجل"
        description="لم يتم تسجيل أي تغييرات في حالة هذه المهمة."
      />
    );
  }

  return (
    <SurfaceCard title="سجل الحالة">
      <div className="space-y-0">
        {task.statusHistory.map((entry, idx) => {
          const isLast = idx === task.statusHistory.length - 1;
          return (
            <div key={entry.id} className="relative pr-8 pb-6 last:pb-0">
              {!isLast && (
                <div className="absolute right-3 top-3 bottom-0 w-px bg-portal-divider" />
              )}
              <div
                className={cn(
                  "absolute right-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                  "bg-natural-0 border-secondary-500",
                )}
              >
                <div className="w-2 h-2 rounded-full bg-secondary-500" />
              </div>

              <div className="mr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-natural-100">
                    {entry.changer.name}
                  </span>
                  <span className="text-xs text-portal-note-text">
                    {new Date(entry.changedAt).toLocaleString("ar-SA")}
                  </span>
                </div>
                <p className="text-sm text-portal-note-text mt-1">
                  {entry.fromStatus
                    ? `${TASK_STATUS_AR[entry.fromStatus as keyof typeof TASK_STATUS_AR] || entry.fromStatus} ← ${TASK_STATUS_AR[entry.toStatus as keyof typeof TASK_STATUS_AR] || entry.toStatus}`
                    : `→ ${TASK_STATUS_AR[entry.toStatus as keyof typeof TASK_STATUS_AR] || entry.toStatus}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
