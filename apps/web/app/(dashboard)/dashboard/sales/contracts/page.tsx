"use client";

import { CreateContractDialog } from "@/components/dashboard/sales/CreateContractDialog";
import { ContractsTable } from "@/components/dashboard/sales/ContractsTable";
import { useGetContractsQuery } from "@/features/contracts/contractsApi";

export default function ContractsPage() {
  const { data, isLoading, isError } = useGetContractsQuery({
    page: 1,
    limit: 20,
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">العقود</h1>
        <CreateContractDialog />
      </div>

      {isLoading && (
        <div className="h-32 rounded-md border bg-muted/30 animate-pulse" />
      )}

      {isError && (
        <div className="rounded-md border p-4 text-sm text-destructive">
          فشل تحميل العقود.
        </div>
      )}

      {!isLoading && !isError && (
        <ContractsTable contracts={data?.items ?? []} />
      )}
    </div>
  );
}
