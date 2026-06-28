"use client";

import { Calendar, FileText, Search } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import { Popover } from "@/components/design-system/Popover";
import { ActionButton } from "@/components/design-system/ActionButton";
import { CountChip } from "@/components/design-system/CountChip";
import { cn } from "@/lib/utils";
import { formatShortDateLong } from "@/lib/format";

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface ContractsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  totalCount: number;
  visibleCount: number;
}

/**
 * Toolbar — search + date popover + count chip.
 *
 * Mirrors the deliverables toolbar structure (page IS the queue).
 * The date popover offers "Last 7 days", "Today", and explicit
 * pickers (from / to). "Clear" resets the range.
 */
export function ContractsToolbar({
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  totalCount,
  visibleCount,
}: ContractsToolbarProps) {
  const hasFilter =
    search.trim().length > 0 || !!dateRange.from || !!dateRange.to;

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <Input
          placeholder="ابحث باسم العقد…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search className="size-4" />}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <DateRangePopover
          value={dateRange}
          onChange={onDateRangeChange}
        />

        <CountChip
          hasFilter={hasFilter}
          total={totalCount}
          visible={visibleCount}
          icon={<FileText className="h-3.5 w-3.5" />}
          unfilteredLabel="عقد"
        />
      </div>
    </div>
  );
}

// ─── Date range popover ──────────────────────────────────────────────────────

function DateRangePopover({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const hasRange = !!value.from || !!value.to;
  const label = hasRange
    ? `${formatShortDateLong(value.from?.toISOString() ?? null)} → ${formatShortDateLong(value.to?.toISOString() ?? null)}`
    : "اختر التاريخ";

  return (
    <Popover
      align="start"
      contentClassName="w-auto p-0"
      trigger={
        <ActionButton
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 rounded-lg border px-3 text-[12.5px] font-medium gap-1.5",
            hasRange
              ? "border-primary-300 bg-primary-100 text-primary-700"
              : "border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="tabular-nums">{label}</span>
        </ActionButton>
      }
    >
      <DateRangePanel value={value} onChange={onChange} />
    </Popover>
  );
}

function DateRangePanel({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  function presetLast7() {
    onChange({
      from: new Date(new Date().setDate(new Date().getDate() - 7)),
      to: new Date(),
    });
  }
  function presetToday() {
    onChange({ from: new Date(), to: new Date() });
  }
  function updateFrom(iso: string) {
    onChange({ ...value, from: iso ? new Date(iso) : undefined });
  }
  function updateTo(iso: string) {
    onChange({ ...value, to: iso ? new Date(iso) : undefined });
  }

  return (
    <div className="p-3 flex flex-col gap-3 w-[280px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-natural-100">
          تحديد الفترة
        </span>
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-[11px] font-medium text-portal-note-text hover:text-secondary-500 transition-colors"
        >
          مسح
        </button>
      </div>

      <div className="flex gap-2">
        <ActionButton
          variant="ghost"
          size="sm"
          onClick={presetLast7}
          className="flex-1 h-8 rounded-lg border border-portal-card-border bg-natural-0 text-[12px] font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500"
        >
          آخر 7 أيام
        </ActionButton>
        <ActionButton
          variant="ghost"
          size="sm"
          onClick={presetToday}
          className="flex-1 h-8 rounded-lg border border-portal-card-border bg-natural-0 text-[12px] font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500"
        >
          اليوم
        </ActionButton>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DateField
          label="من"
          value={value.from ? toInputDate(value.from) : ""}
          onChange={updateFrom}
        />
        <DateField
          label="إلى"
          value={value.to ? toInputDate(value.to) : ""}
          onChange={updateTo}
        />
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-portal-note-text">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-lg border border-portal-card-border bg-natural-0 px-2.5",
          "text-[12px] text-natural-100",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400",
        )}
      />
    </label>
  );
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
