"use client";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useState, useCallback, useMemo } from "react";
import { FileText } from "lucide-react";
import { useGetMyPortalProposalsQuery } from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import {
  renderProposalRowCells,
  ProposalsToolbar,
} from "@/components/portal/proposals";

export default function PortalProposalsPage() {
  const {
    data: proposals,
    isLoading,
    isError,
  } = useGetMyPortalProposalsQuery(undefined, {
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const statusFilter = activeFilters["status"]?.[0] ?? "";

  const filtered = useMemo(() => {
    if (!proposals) return [];
    const q = search.trim().toLowerCase();
    return proposals.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.lead?.companyName?.toLowerCase().includes(q) ?? false) ||
        (p.request?.companyName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [proposals, search, statusFilter]);

  const handleFilterChange = useCallback((key: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [key]: values }));
  }, []);

  const hasActiveSearchOrFilter =
    search.trim().length > 0 ||
    Object.values(activeFilters).some((v) => v.length > 0);

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="العروض الفنية"
        description="استعرض العروض الفنية المقدّمة لك وراجع تفاصيلها قبل الموافقة."
        icon={FileText}
      />

      <ProposalsToolbar
        search={search}
        onSearchChange={setSearch}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        proposals={proposals}
        totalCount={proposals?.length ?? 0}
        visibleCount={filtered.length}
      />

      <DataTable
        columns={[
          { id: "title", label: "عنوان العرض" },
          { id: "price", label: "السعر", align: "center" },
          { id: "sentDate", label: "تاريخ الإرسال" },
          { id: "status", label: "الحالة" },
          { id: "action", label: "", align: "left", width: "150px" },
        ]}
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل العروض."
        skeletonRows={6}
        emptyState={{
          icon: FileText,
          message: hasActiveSearchOrFilter
            ? "لا توجد نتائج مطابقة"
            : "لا توجد عروض فنية حتى الآن.",
          hint: hasActiveSearchOrFilter
            ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
            : "ستظهر هنا العروض الفنية المقدّمة لك فور إعدادها من قبل فريق المبيعات.",
        }}
        renderCells={(p, { onActivate }) =>
          renderProposalRowCells(p, { onActivate })
        }
      />
    </div>
  );
}
