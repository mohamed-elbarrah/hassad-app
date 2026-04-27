"use client";

import { useState } from "react";
import { ClientFiltersBar } from "@/components/dashboard/crm/ClientFiltersBar";
import { ClientsTable } from "@/components/dashboard/crm/ClientsTable";
import { ClientsTableSkeleton } from "@/components/dashboard/crm/ClientsTableSkeleton";
import { CreateClientDialog } from "@/components/dashboard/crm/CreateClientDialog";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import type { ClientFilters } from "@/features/clients/clientsApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

function resolveClientError(error: unknown): string {
  const e = error as FetchBaseQueryError | undefined;
  if (!e) return "حدث خطأ غير متوقع.";
  if (e.status === 401) return "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.";
  if (e.status === 403) return "لا تملك صلاحية الوصول إلى بيانات العملاء.";
  if (typeof e.status === "number" && e.status >= 500)
    return "خطأ في الخادم. يرجى المحاولة لاحقاً.";
  if (e.status === "FETCH_ERROR") return "تعذّر الاتصال بالخادم. تحقق من الشبكة.";
  return "حدث خطأ أثناء تحميل العملاء. يرجى المحاولة مجدداً.";
}

export default function AdminClientsPage() {
  const [filters, setFilters] = useState<ClientFilters>({ page: 1, limit: 20 });
  const { data, isLoading, isError, error } = useGetClientsQuery(filters);

  const page = filters.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">العملاء (CRM)</h1>
        <CreateClientDialog />
      </div>

      <ClientFiltersBar filters={filters} onChange={setFilters} />

      {isLoading && <ClientsTableSkeleton />}

      {isError && (
        <p className="text-sm text-destructive">
          {resolveClientError(error)}
        </p>
      )}

      {!isLoading && !isError && (
        <ClientsTable
          clients={data?.items ?? []}
          page={page}
          totalPages={totalPages}
          onPageChange={(nextPage) =>
            setFilters({ ...filters, page: nextPage })
          }
        />
      )}
    </div>
  );
}
