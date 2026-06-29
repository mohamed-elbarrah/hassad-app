"use client";

import { useFilterGroups } from "@/hooks/useFilterGroups";
import { QueueToolbar } from "@/components/portal/shared/QueueToolbar";
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

  return (
    <QueueToolbar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="ابحث برقم الفاتورة أو العقد…"
      filterGroups={filterGroups}
      activeFilters={activeFilters}
      onFilterChange={onFilterChange}
      countLabel="فاتورة"
      count={visibleCount}
    />
  );
}
