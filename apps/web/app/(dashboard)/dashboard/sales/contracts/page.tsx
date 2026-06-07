"use client";

import { CreateContractDialog } from "@/components/dashboard/sales/CreateContractDialog";
import { ContractsTable } from "@/components/dashboard/sales/ContractsTable";
import { useGetContractsQuery } from "@/features/contracts/contractsApi";
import { Skeleton } from "@/components/design-system/Skeleton";
import { StatusBanner } from "@/components/design-system/StatusBanner";

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
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && (
        <StatusBanner variant="danger">فشل تحميل العقود.</StatusBanner>
      )}

      {!isLoading && !isError && (
        <ContractsTable contracts={data?.items ?? []} />
      )}
    </div>
  );
}
