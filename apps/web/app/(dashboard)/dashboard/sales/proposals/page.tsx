"use client";

import { CreateProposalDialog } from "@/components/dashboard/sales/CreateProposalDialog";
import { ProposalsTable } from "@/components/dashboard/sales/ProposalsTable";
import { useGetProposalsQuery } from "@/features/proposals/proposalsApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

function resolveProposalError(error: unknown): string {
  const e = error as FetchBaseQueryError | undefined;
  if (!e) return "حدث خطأ غير متوقع.";
  if (e.status === 401) return "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.";
  if (e.status === 403) return "لا تملك صلاحية الوصول إلى العروض الفنية.";
  if (typeof e.status === "number" && e.status >= 500)
    return "خطأ في الخادم. يرجى المحاولة لاحقاً.";
  if (e.status === "FETCH_ERROR") return "تعذّر الاتصال بالخادم. تحقق من الشبكة.";
  return "فشل تحميل العروض الفنية.";
}

export default function ProposalsPage() {
  const { data, isLoading, isError, error } = useGetProposalsQuery({
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
          {resolveProposalError(error)}
        </div>
      )}

      {!isLoading && !isError && (
        <ProposalsTable proposals={data?.items ?? []} />
      )}
    </div>
  );
}
