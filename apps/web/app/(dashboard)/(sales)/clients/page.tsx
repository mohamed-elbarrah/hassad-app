"use client";

import { useState } from "react";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import type { ClientFilters } from "@/features/clients/clientsApi";
import { ClientsTable } from "@/components/dashboard/crm/ClientsTable";
import { ClientsTableSkeleton } from "@/components/dashboard/crm/ClientsTableSkeleton";
import { CreateClientDialog } from "@/components/dashboard/crm/CreateClientDialog";
import { ClientFiltersBar } from "@/components/dashboard/crm/ClientFiltersBar";

export default function ClientsPage() {
  const [filters, setFilters] = useState<ClientFilters>({ page: 1, limit: 20 });

  const { data, isLoading, isError } = useGetClientsQuery(filters);

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">العملاء</h1>
          <p className="text-sm text-muted-foreground">
            إدارة العملاء ومتابعة مراحل البيع
          </p>
        </div>
        <CreateClientDialog />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <ClientFiltersBar filters={filters} onChange={setFilters} />

      {/* ── Table ────────────────────────────────────────────────────── */}
      {isLoading && <ClientsTableSkeleton />}

      {isError && (
        <div className="flex h-40 items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          فشل تحميل بيانات العملاء. يرجى تحديث الصفحة.
        </div>
      )}

      {data && !isLoading && (
        <>
          {data.items.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-4 rounded-md border border-dashed text-muted-foreground">
              <p className="text-sm">لا يوجد عملاء بعد.</p>
              <CreateClientDialog />
            </div>
          ) : (
            <ClientsTable
              clients={data.items}
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          )}
        </>
      )}
    </div>
  );
}
