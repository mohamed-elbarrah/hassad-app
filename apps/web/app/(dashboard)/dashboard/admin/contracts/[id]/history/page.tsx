"use client";

import { use } from "react";
import { History, ArrowLeft } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminContractByIdQuery } from "@/features/admin/adminContractsApi";

export default function ContractHistoryTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contract } = useGetAdminContractByIdQuery(id);

  if (!contract) return null;

  if (!contract.statusHistory || contract.statusHistory.length === 0) {
    return (
      <AdminEmptyState
        icon={History}
        title="لا يوجد سجل للحالة"
        description="لم يتم تسجيل أي تغييرات في حالة هذا العقد بعد."
      />
    );
  }

  return (
    <SurfaceCard title="سجل تغييرات الحالة">
      <div className="space-y-3">
        {contract.statusHistory.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-4 p-4 rounded-xl border border-portal-card-border"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 shrink-0">
              <ArrowLeft className="h-4 w-4 text-secondary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {entry.fromStatus && (
                  <AdminStatusBadge
                    domain="contract"
                    status={entry.fromStatus}
                  />
                )}
                {entry.fromStatus && (
                  <ArrowLeft className="h-3 w-3 text-portal-note-text" />
                )}
                <AdminStatusBadge domain="contract" status={entry.toStatus} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-portal-note-text">
                <span>
                  {new Date(entry.changedAt).toLocaleDateString("ar-SA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>بواسطة {entry.changer.name}</span>
              </div>
              {entry.reason && (
                <p className="text-sm text-natural-100 mt-1.5">
                  {entry.reason}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
