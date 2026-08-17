"use client";

import { Search, Filter, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

interface AdminListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (key: string, values: string[]) => void;
  children?: React.ReactNode;
}

export function AdminListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "بحث...",
  filterGroups,
  activeFilters = {},
  onFilterChange,
  children,
}: AdminListToolbarProps) {
  const totalActive = Object.values(activeFilters).reduce(
    (sum, vals) => sum + vals.length,
    0,
  );

  function handleToggle(groupKey: string, value: string) {
    if (!onFilterChange) return;
    const current = activeFilters[groupKey] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(groupKey, next);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex-1 w-full sm:w-auto">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>
      {filterGroups && onFilterChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2",
                totalActive > 0 && "border-primary text-primary",
              )}
            >
              <Filter className="size-4" />
              تصفية
              {totalActive > 0 && (
                <Badge variant="default" className="size-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {totalActive}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <div className="space-y-4">
              {filterGroups.map((group, idx) => (
                <div key={group.key}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.options.map((option) => {
                      const isActive = (activeFilters[group.key] ?? []).includes(
                        option.value,
                      );
                      return (
                        <label
                          key={option.value}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isActive}
                              onCheckedChange={() => handleToggle(group.key, option.value)}
                            />
                            <span className="text-sm">{option.label}</span>
                          </div>
                          {option.count !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {option.count}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
      {children}
    </div>
  );
}
