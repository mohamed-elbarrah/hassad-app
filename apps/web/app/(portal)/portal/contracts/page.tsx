"use client";

import { useState, useCallback } from "react";
import { useGetPortalContractsQuery } from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { Pagination } from "@/components/design-system/Pagination";
import { DataTable } from "@/components/design-system/DataTable";
import { FileText } from "lucide-react";
import {
  renderContractRowCells,
  ContractsToolbar,
  type DateRange,
} from "@/components/portal/contracts";

const PAGE_SIZE = 10;

export default function PortalContractsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({});

  const { data, isLoading, isError } = useGetPortalContractsQuery(
    {
      page,
      limit: PAGE_SIZE,
      search,
      dateFrom: dateRange.from?.toISOString(),
      dateTo: dateRange.to?.toISOString(),
    },
    { pollingInterval: 120_000 },
  );

  const contracts = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
    setPage(1);
  }, []);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="العقود"
        description="استعرض جميع عقودك الحالية، حالة كل عقد، القيمة، وتواريخ البدء والانتهاء."
        icon={FileText}
      />

      <ContractsToolbar
        search={search}
        onSearchChange={handleSearchChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        totalCount={total}
        visibleCount={contracts.length}
      />

      <DataTable
        columns={[
          { id: "title", label: "العقد" },
          { id: "value", label: "القيمة" },
          { id: "period", label: "الفترة" },
          { id: "status", label: "الحالة" },
          { id: "manager", label: "مدير المشروع" },
          { id: "action", label: "", align: "left", width: "150px" },
        ]}
        data={contracts}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل العقود."
        skeletonRows={6}
        emptyState={{
          icon: FileText,
          message:
            search || dateRange.from || dateRange.to
              ? "لا توجد نتائج مطابقة"
              : "لا توجد عقود متاحة حالياً.",
          hint:
            search || dateRange.from || dateRange.to
              ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
              : "ستظهر هنا جميع العقود المرتبطة بحسابك بمجرد إنشائها.",
        }}
        renderCells={(c, { onActivate }) => renderContractRowCells(c, { onActivate })}
      />

      {!isLoading && !isError && contracts.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}