"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import { DataTable } from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { renderClientRowCells } from "@/components/dashboard/sales/ClientRow";
import { SalesPageHeader } from "@/components/dashboard/sales/shared/SalesPageHeader";
import { SalesListToolbar } from "@/components/dashboard/sales/shared/SalesListToolbar";
import type { FilterGroup } from "@/components/design-system/FilterBar";
import { ClientStatus } from "@hassad/shared";

const PAGE_SIZE = 20;

const STATUS_FILTERS: FilterGroup[] = [
  {
    key: "status",
    label: "الحالة",
    options: [
      { label: "الكل", value: "" },
      { label: "نشط", value: ClientStatus.ACTIVE },
      { label: "متوقف", value: ClientStatus.STOPPED },
      { label: "عميل محتمل", value: ClientStatus.LEAD },
    ],
  },
];

export default function SalesClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [page, setPage] = useState(1);

  const statusFilter = activeFilters["status"]?.[0] ?? "";

  const { data, isLoading, isError } = useGetClientsQuery({
    search: search || undefined,
    status: (statusFilter as ClientStatus) || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const clients = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
      setPage(1);
    },
    [],
  );

  const handleRowActivate = useCallback(
    (client: (typeof clients)[number]) => {
      router.push(`/dashboard/sales/clients/${client.id}`);
    },
    [router],
  );

  const hasActiveFilter = search || statusFilter;

  return (
    <div className="page-shell" dir="rtl">
      <SalesPageHeader
        title="العملاء"
        description={`إدارة العملاء — إجمالي ${total} عميل`}
        icon={Users}
      />

      <SalesListToolbar
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="ابحث باسم العميل..."
        filterGroups={STATUS_FILTERS}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        countLabel="عميل"
        count={clients.length}
      />

      <DataTable
        columns={[
          { id: "companyName", label: "الشركة" },
          { id: "contactName", label: "المسؤول" },
          { id: "phone", label: "الجوّال / واتساب" },
          { id: "email", label: "البريد الإلكتروني" },
          { id: "status", label: "الحالة" },
          { id: "projects", label: "المشاريع" },
          { id: "manager", label: "مدير الحساب" },
          { id: "lastActivity", label: "آخر نشاط" },
          { id: "createdAt", label: "تاريخ الإضافة" },
        ]}
        data={clients}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل العملاء."
        skeletonRows={8}
        emptyState={{
          icon: Users,
          message: hasActiveFilter
            ? "لا توجد نتائج مطابقة"
            : "لا يوجد عملاء بعد.",
          hint: hasActiveFilter
            ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
            : "سيظهر هنا جميع العملاء المسجلين.",
        }}
        renderCells={(client) => renderClientRowCells(client)}
        onRowActivate={handleRowActivate}
      />

      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
