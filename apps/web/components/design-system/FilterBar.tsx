"use client";

import { useState } from "react";
import { Filter, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover } from "@/components/design-system/Popover";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  groups: FilterGroup[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (groupKey: string, values: string[]) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FilterBar({
  groups,
  activeFilters,
  onFilterChange,
  className,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);

  const totalActive = Object.values(activeFilters).reduce(
    (sum, vals) => sum + vals.length,
    0,
  );

  function handleToggle(groupKey: string, value: string) {
    const current = activeFilters[groupKey] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(groupKey, next);
  }

  function handleClear() {
    for (const group of groups) {
      onFilterChange(group.key, []);
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border-[1.5px] px-4 h-9 text-sm font-medium transition-colors cursor-pointer",
              totalActive > 0
                ? "border-secondary-500 bg-secondary-500/10 text-secondary-500"
                : "border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
            )}
          >
            <Filter className="w-4 h-4" />
            تصفية
            {totalActive > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-secondary-500 text-white text-xs font-semibold">
                {totalActive}
              </span>
            )}
          </button>
        }
      >
        <div className="space-y-4" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-natural-100">تصفية</h3>
            {totalActive > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-danger-600 hover:text-danger-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                مسح الكل
              </button>
            )}
          </div>

          {/* Filter groups */}
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="text-xs font-medium text-neutral-300 mb-2">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.options.map((option) => {
                    const isActive = (activeFilters[group.key] ?? []).includes(
                      option.value,
                    );

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleToggle(group.key, option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                          isActive
                            ? "bg-secondary-500/10 text-secondary-500"
                            : "text-portal-icon hover:bg-badge-gray-bg",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex items-center justify-center w-4 h-4 rounded border-[1.5px] transition-colors shrink-0",
                              isActive
                                ? "border-secondary-500 bg-secondary-500"
                                : "border-neutral-200 bg-natural-0",
                            )}
                          >
                            {isActive && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </span>
                          {option.label}
                        </span>
                        {option.count !== undefined && (
                          <span
                            className={cn(
                              "text-xs",
                              isActive
                                ? "text-secondary-500"
                                : "text-neutral-300",
                            )}
                          >
                            {option.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Popover>
    </div>
  );
}
