"use client";

import { Check, Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SalesFilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SalesFilterGroup {
  key: string;
  label: string;
  options: SalesFilterOption[];
}

interface SalesFilterBarProps {
  groups: SalesFilterGroup[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (groupKey: string, values: string[]) => void;
  className?: string;
}

export function SalesFilterBar({
  groups,
  activeFilters,
  onFilterChange,
  className,
}: SalesFilterBarProps) {
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
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={totalActive > 0 ? "default" : "outline"}
            className="gap-2 rounded-xl"
          >
            <Filter className="size-4" />
            تصفية
            {totalActive > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-background/20 px-1.5 py-0.5 text-xs text-current">
                {totalActive}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start" dir="rtl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">تصفية</h3>
              {totalActive > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-auto gap-1 px-0 text-destructive hover:bg-transparent hover:text-destructive"
                >
                  <X className="size-3" />
                  مسح الكل
                </Button>
              ) : null}
            </div>

            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.key} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
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
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex size-4 items-center justify-center rounded border transition-colors",
                                isActive
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background",
                              )}
                            >
                              {isActive ? <Check className="size-3" /> : null}
                            </span>
                            {option.label}
                          </span>
                          {option.count !== undefined ? (
                            <span className="text-xs text-muted-foreground">
                              {option.count}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
