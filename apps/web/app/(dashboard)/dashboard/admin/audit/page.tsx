"use client";

import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { Input } from "@/components/design-system/Input";
import {
  useGetAdminAuditLogQuery,
  useGetAdminAuditLogFiltersQuery,
} from "@/features/admin/adminApi";

const COLUMNS: DataTableColumn[] = [
  { id: "actionAr", label: "الإجراء", align: "right" },
  { id: "entityAr", label: "الكيان", align: "right" },
  { id: "entityId", label: "معرف الكيان", align: "right" },
  { id: "userName", label: "المستخدم", align: "right" },
  { id: "userEmail", label: "البريد الإلكتروني", align: "right" },
  { id: "createdAt", label: "التاريخ", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: ScrollText,
  message: "لا يوجد سجل تدقيق",
  hint: "لم يتم تسجيل أي أحداث تدقيق بعد.",
};

export default function AdminAuditPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const { data: filtersData } = useGetAdminAuditLogFiltersQuery();

  const { data, isLoading, isError } = useGetAdminAuditLogQuery({
    search: search || undefined,
    action: activeFilters.action?.[0],
    entity: activeFilters.entity?.[0],
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 20,
  });

  const auditLogs = useMemo(() => data?.items ?? [], [data]);

  const actionOptions = useMemo(
    () => (filtersData?.actions ?? []).map((a) => ({ label: a, value: a })),
    [filtersData],
  );

  const entityOptions = useMemo(
    () => (filtersData?.entityTypes ?? []).map((e) => ({ label: e, value: e })),
    [filtersData],
  );

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="سجل التدقيق"
        description="تتبع جميع الأحداث والتغييرات في المنصة"
        icon={ScrollText}
      />

      <SurfaceCard title="سجل الأحداث">
        <div className="mb-4 flex flex-col gap-3">
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="بحث في سجل التدقيق..."
            filterGroups={[
              {
                key: "action",
                label: "الإجراء",
                options: actionOptions,
              },
              {
                key: "entity",
                label: "الكيان",
                options: entityOptions,
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(key, values) =>
              setActiveFilters((prev) => ({ ...prev, [key]: values }))
            }
          />
          <div className="flex gap-3">
            <Input
              placeholder="من تاريخ (YYYY-MM-DD)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              placeholder="إلى تاريخ (YYYY-MM-DD)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          columns={COLUMNS}
          data={auditLogs}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل سجل التدقيق."
          emptyState={EMPTY_STATE}
          renderRow={(entry) => (
            <tr
              key={entry.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="audit" status={entry.action} />
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {entry.entityAr || entry.entity}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text font-mono">
                {entry.entityId.slice(0, 8)}...
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {entry.userName || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {entry.userEmail || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {new Date(entry.createdAt).toLocaleDateString("ar-SA")}
              </td>
            </tr>
          )}
        />

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
