"use client";

import { useState } from "react";
import { ProposalFormDialog } from "@/components/dashboard/sales/ProposalFormDialog";
import { ProposalsTable } from "@/components/dashboard/sales/ProposalsTable";
import { CreateContractDialog } from "@/components/dashboard/sales/CreateContractDialog";
import { useGetProposalsQuery } from "@/features/proposals/proposalsApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Skeleton } from "@/components/design-system/Skeleton";
import { StatusBanner } from "@/components/design-system/StatusBanner";

function resolveProposalError(error: unknown): string {
  const e = error as FetchBaseQueryError | undefined;
  if (!e) return "حدث خطأ غير متوقع.";
  if (e.status === 401) return "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.";
  if (e.status === 403) return "لا تملك صلاحية الوصول إلى العروض الفنية.";
  if (typeof e.status === "number" && e.status >= 500)
    return "خطأ في الخادم. يرجى المحاولة لاحقاً.";
  if (e.status === "FETCH_ERROR")
    return "تعذّر الاتصال بالخادم. تحقق من الشبكة.";
  return "فشل تحميل العروض الفنية.";
}

export default function ProposalsPage() {
  const { data, isLoading, isError, error } = useGetProposalsQuery({
    page: 1,
    limit: 20,
  });

  const [contractDialogProposalId, setContractDialogProposalId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">العروض الفنية</h1>
        <ProposalFormDialog mode="create" />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && (
        <StatusBanner variant="danger">
          {resolveProposalError(error)}
        </StatusBanner>
      )}

      {!isLoading && !isError && (
        <ProposalsTable
          proposals={data?.items ?? []}
          onCreateContract={(proposalId) => setContractDialogProposalId(proposalId)}
        />
      )}

      {contractDialogProposalId && (
        <CreateContractDialog
          key={contractDialogProposalId}
          proposalId={contractDialogProposalId}
        />
      )}
    </div>
  );
}
