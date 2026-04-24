"use client";

import { CreateProposalDialog } from "@/components/dashboard/sales/CreateProposalDialog";
import { ProposalsTable } from "@/components/dashboard/sales/ProposalsTable";
import { useGetProposalsQuery } from "@/features/proposals/proposalsApi";

export default function ProposalsPage() {
  const { data, isLoading, isError } = useGetProposalsQuery({
    page: 1,
    limit: 20,
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">العروض الفنية</h1>
        <CreateProposalDialog />
      </div>

      {isLoading && (
        <div className="h-32 rounded-md border bg-muted/30 animate-pulse" />
      )}

      {isError && (
        <div className="rounded-md border p-4 text-sm text-destructive">
          فشل تحميل العروض الفنية.
        </div>
      )}

      {!isLoading && !isError && (
        <ProposalsTable proposals={data?.items ?? []} />
      )}
    </div>
  );
}
