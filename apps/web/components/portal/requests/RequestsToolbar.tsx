"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { cn } from "@/lib/utils";
import type { RequestStatusGroup } from "@/lib/utils/requestStatus";

export interface RequestsToolbarFilters {
  query: string;
  /** Single status-group filter (stored as a one-element array so the
   *  `FilterBar` shape stays consistent — `[]` means no filter). */
  statusGroups: RequestStatusGroup[];
}

interface RequestsToolbarProps {
  value: RequestsToolbarFilters;
  onChange: (next: RequestsToolbarFilters) => void;
  /** Counts by group, fed into `FilterBar` options so the user can see
   *  how many requests each filter would return. Pass empty map if you
   *  don't have counts yet (loading state). */
  countsByGroup: ReadonlyMap<RequestStatusGroup, number>;
}

/**
 * Toolbar above the requests table.
 *
 * Composition:
 *   [Search input]  [FilterBar — status group + future filters]
 *
 * Single source of truth for the current filters — owned by the parent
 * page. The toolbar is purely presentational.
 *
 * Design decisions:
 *   - Status filter is exposed through `FilterBar` (the design-system
 *     popover), NOT as inline button chips. Inline chips duplicate the
 *     information that's already in the badge column of the table.
 *   - Sort is intentionally not exposed. The backend already returns the
 *     list in `createdAt DESC` order, which is the only order clients
 *     ever need for a tracking page. If a different sort becomes
 *     necessary later, it should live here — not as a free-standing
 *     dropdown that orphans the FilterBar visually.
 */
export function RequestsToolbar({
  value,
  onChange,
  countsByGroup,
}: RequestsToolbarProps) {
  const update = <K extends keyof RequestsToolbarFilters>(
    key: K,
    next: RequestsToolbarFilters[K],
  ) => onChange({ ...value, [key]: next });

  const filterGroups: FilterGroup[] = [
    {
      key: "statusGroup",
      label: "حالة الطلب",
      options: [
        {
          value: "received",
          label: "مستلم",
          count: countsByGroup.get("received") ?? 0,
        },
        {
          value: "preparing",
          label: "قيد الإعداد",
          count: countsByGroup.get("preparing") ?? 0,
        },
        {
          value: "awaiting-you",
          label: "بانتظار توقيعك",
          count: countsByGroup.get("awaiting-you") ?? 0,
        },
        {
          value: "signed",
          label: "موقّع",
          count: countsByGroup.get("signed") ?? 0,
        },
        {
          value: "cancelled",
          label: "ملغي",
          count: countsByGroup.get("cancelled") ?? 0,
        },
      ],
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
      )}
      dir="rtl"
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Input
          icon={<Search className="size-4" />}
          placeholder="ابحث في الطلبات..."
          value={value.query}
          onChange={(e) => update("query", e.target.value)}
          className="h-10"
          aria-label="بحث في الطلبات"
        />
        {value.query && (
          <button
            type="button"
            onClick={() => update("query", "")}
            aria-label="مسح البحث"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-icon hover:text-secondary-500"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filter (status group, ready for more) */}
      <FilterBar
        groups={filterGroups}
        activeFilters={
          value.statusGroups.length > 0
            ? { statusGroup: value.statusGroups }
            : {}
        }
        onFilterChange={(key, vals) =>
          update("statusGroups", vals as RequestStatusGroup[])
        }
      />
    </div>
  );
}
