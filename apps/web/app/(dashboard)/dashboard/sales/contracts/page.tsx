"use client";

import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { useGetContractsQuery } from "@/features/contracts/contractsApi";
import { SalesDataTable } from "@/components/dashboard/sales/shared/SalesDataTable";
import { SalesPagination } from "@/components/dashboard/sales/shared/SalesPagination";
import { CreateContractDialog } from "@/components/dashboard/sales/CreateContractDialog";
import { renderContractRowCells } from "@/components/dashboard/sales/ContractRow";
import { SalesPageHeader } from "@/components/dashboard/sales/shared/SalesPageHeader";
import { SalesListToolbar } from "@/components/dashboard/sales/shared/SalesListToolbar";
import type { SalesFilterGroup } from "@/components/dashboard/sales/shared/SalesFilterBar";
import { ContractStatus } from "@hassad/shared";

const PAGE_SIZE = 20;

const STATUS_FILTERS: SalesFilterGroup[] = [
  {
    key: "status",
    label: "الحالة",
    options: [
      { label: "الكل", value: "" },
      { label: "مسودة", value: ContractStatus.DRAFT },
      { label: "مرسل", value: ContractStatus.SENT },
      { label: "موقع", value: ContractStatus.SIGNED },
      { label: "نشط", value: ContractStatus.ACTIVE },
      { label: "معلق", value: ContractStatus.ON_HOLD },
      { label: "مكتمل", value: ContractStatus.COMPLETED },
      { label: "منتهي", value: ContractStatus.EXPIRED },
      { label: "ملغى", value: ContractStatus.CANCELLED },
    ],
  },
];

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [page, setPage] = useState(1);

  const statusFilter = activeFilters["status"]?.[0] ?? "";

  const { data, isLoading, isError } = useGetContractsQuery({
    search: search || undefined,
    status: (statusFilter as ContractStatus) || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const contracts = data?.items ?? [];

  const totalPages = data?.totalPages ?? 1;

  const [contractDialogOpen, setContractDialogOpen] = useState(false);

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

  const hasActiveFilter = search || statusFilter;

  return (
    <div className="page-shell" dir="rtl">
      <SalesPageHeader
        title="العقود"
        description="إدارة العقود، تتبع حالتها، ومشاركة روابط التوقيع مع العملاء."
        icon={FileText}
        actions={
          <CreateContractDialog
            open={contractDialogOpen}
            onOpenChange={setContractDialogOpen}
          />
        }
      />

      <SalesListToolbar
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="ابحث عن عقد..."
        filterGroups={STATUS_FILTERS}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        countLabel="عقد"
        count={contracts.length}
      />

      <SalesDataTable
        columns={[
          { id: "client", label: "العميل" },
          { id: "totalValue", label: "القيمة" },
          { id: "period", label: "الفترة" },
          { id: "status", label: "الحالة" },
          { id: "actions", label: "إجراءات", align: "left" },
        ]}
        data={contracts}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل العقود."
        skeletonRows={8}
        emptyState={{
          icon: FileText,
          message: hasActiveFilter
            ? "لا توجد عقود تطابق البحث"
            : "لا توجد عقود بعد.",
          hint: hasActiveFilter
            ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
            : "أنشئ عقداً جديداً من صفحة العروض بعد اعتمادها.",
        }}
        renderCells={(contract) => renderContractRowCells(contract)}
      />

      {!isLoading && !isError && totalPages > 1 && (
        <SalesPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
