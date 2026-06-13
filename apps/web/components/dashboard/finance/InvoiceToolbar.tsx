"use client";

import { useState } from "react";
import { Search, Filter, X, Download, ChevronDown } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@hassad/shared";

export type StatusFilter = "all" | InvoiceStatus;

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  status: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  onExport: () => void;
  className?: string;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: InvoiceStatus.DUE, label: "مستحق" },
  { value: InvoiceStatus.SENT, label: "تم الإرسال" },
  { value: InvoiceStatus.PAID, label: "مدفوع" },
  { value: InvoiceStatus.PARTIAL, label: "مدفوع جزئياً" },
  { value: InvoiceStatus.LATE, label: "متأخر" },
  { value: InvoiceStatus.CANCELLED, label: "ملغي" },
];

export function InvoiceToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onExport,
  className,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false);

  const hasFilters = search || status !== "all";

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row lg:items-center gap-3",
        className,
      )}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <FormInputControl
          placeholder="البحث برقم الفاتورة أو اسم العميل..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-10 h-11"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-natural-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Status Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              "flex items-center gap-2 h-11 px-3 rounded-xl border text-sm font-medium transition-all",
              "bg-natural-0 border-portal-card-border hover:border-secondary-500/40",
              filterOpen && "border-secondary-500 ring-2 ring-secondary-500/10",
              status !== "all" && "border-secondary-400/60 bg-secondary-50/50",
            )}
          >
            <Filter className="w-4 h-4" />
            <span>{STATUS_OPTIONS.find((o) => o.value === status)?.label}</span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-neutral-400 transition-transform",
                filterOpen && "rotate-180",
              )}
            />
            {status !== "all" && (
              <span className="w-2 h-2 rounded-full bg-secondary-500" />
            )}
          </button>

          {filterOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setFilterOpen(false)}
              />
              <div className="absolute top-full right-0 mt-2 z-50 w-44 rounded-xl border border-portal-card-border bg-natural-0 shadow-lg overflow-hidden">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onStatusChange(opt.value);
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50",
                      status === opt.value &&
                        "bg-secondary-50 text-secondary-600 font-semibold",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Export */}
        <ActionButton
          variant="outline"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={onExport}
        >
          تصدير
        </ActionButton>

        {/* Clear Filters */}
        {hasFilters && (
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange("");
              onStatusChange("all");
            }}
          >
            <X className="w-4 h-4" />
            مسح الفلاتر
          </ActionButton>
        )}
      </div>
    </div>
  );
}
