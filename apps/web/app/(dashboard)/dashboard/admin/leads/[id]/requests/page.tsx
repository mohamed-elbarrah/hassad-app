"use client";

import { use } from "react";
import { FileText, DollarSign } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminLeadByIdQuery } from "@/features/admin/adminLeadsApi";
import { PROPOSAL_STATUS_AR } from "@hassad/shared";

export default function LeadProposalsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: lead } = useGetAdminLeadByIdQuery(id);

  if (!lead) return null;

  if (lead.proposals.length === 0) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="لا توجد عروض"
        description="لم يتم إرسال أي عروض لهذا العميل المتوقع بعد."
      />
    );
  }

  return (
    <SurfaceCard title="العروض">
      <div className="space-y-3">
        {lead.proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="flex items-start gap-4 p-4 rounded-xl border border-portal-card-border"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 shrink-0 mt-1">
              <FileText className="h-4 w-4 text-secondary-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-natural-100">
                    {proposal.title}
                  </p>
                  <p className="text-xs text-portal-note-text mt-1">
                    {new Date(proposal.createdAt).toLocaleDateString("ar-SA", {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-sm font-medium text-natural-100">
                    <DollarSign className="h-3.5 w-3.5 text-secondary-500" />
                    {proposal.totalPrice.toLocaleString()} ر.س
                  </span>
                  <AdminStatusBadge
                    domain="proposal"
                    status={proposal.status}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
