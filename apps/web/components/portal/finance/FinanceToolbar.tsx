"use client";

import { Inbox, Search } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import { FilterBar } from "@/components/design-system/FilterBar";
import { CountChip } from "@/components/design-system/CountChip";
import { useFilterGroups } from "@/hooks/useFilterGroups";
import type { PortalInvoiceSummary } from "@/features/portal/portalApi";

interface FinanceToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  invoices: PortalInvoiceSummary[] | undefined;
  visibleCount: number;
  totalCount: number;
}

const STATUS_LABEL: Record<string, string> = {
  PAID: "مدفوعة",
  PARTIAL: "مدفوعة جزئياً",
  DUE: "مستحقة",
  LATE: "متأخرة",
  SENT: "مُرسلة",
  PENDING: "قيد الانتظار",
  CANCELLED: "ملغاة",
};

const STATUS_ORDER = [
  "DUE",
  "SENT",
  "LATE",
  "PARTIAL",
  "PENDING",
  "PAID",
  "CANCELLED",
] as const;

export function FinanceToolbar({
  search,
  onSearchChange,
  activeFilters,
  onFilterChange,
  invoices,
  visibleCount,
  totalCount,
}: FinanceToolbarProps) {
  const filterGroups = useFilterGroups(invoices, {
    key: "status",
    label: "الحالة",
    pick: (inv) => inv.status,
    labelMap: STATUS_LABEL,
    preference: STATUS_ORDER,
  });

  const hasFilter =
    search.trim().length > 0 ||
    Object.values(activeFilters).some((v) => v.length > 0);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <Input
          placeholder="ابحث برقم الفاتورة أو العقد…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search className="size-4" />}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <FilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
        />

        <CountChip
          hasFilter={hasFilter}
          total={totalCount}
          visible={visibleCount}
          icon={<Inbox className="h-3.5 w-3.5" />}
          unfilteredLabel="فاتورة"
        />
      </div>
    </div>
  );
}