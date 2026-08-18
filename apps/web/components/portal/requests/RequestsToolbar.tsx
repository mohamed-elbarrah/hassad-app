"use client";

import { Filter, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  REQUEST_STATUS_GROUP_LABELS,
  type RequestStatusGroup,
} from "@/lib/utils/requestStatus";

export interface RequestsToolbarFilters {
  query: string;
  statusGroups: RequestStatusGroup[];
}

interface RequestsToolbarProps {
  value: RequestsToolbarFilters;
  onChange: (next: RequestsToolbarFilters) => void;
  countsByGroup: ReadonlyMap<RequestStatusGroup, number>;
}

const STATUS_OPTIONS = Object.keys(REQUEST_STATUS_GROUP_LABELS)
  .filter(
    (value): value is Exclude<RequestStatusGroup, "all"> => value !== "all",
  )
  .map((value) => ({
    value,
    label: REQUEST_STATUS_GROUP_LABELS[value],
  }));

export function RequestsToolbar({
  value,
  onChange,
  countsByGroup,
}: RequestsToolbarProps) {
  const toggleStatus = (status: Exclude<RequestStatusGroup, "all">) => {
    const statusGroups = value.statusGroups.includes(status)
      ? value.statusGroups.filter((current) => current !== status)
      : [...value.statusGroups, status];
    onChange({ ...value, statusGroups });
  };

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      dir="rtl"
    >
      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9 pe-9"
          placeholder="ابحث في الطلبات..."
          value={value.query}
          onChange={(event) =>
            onChange({ ...value, query: event.target.value })
          }
          aria-label="بحث في الطلبات"
        />
        {value.query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-1 top-1/2 size-8 -translate-y-1/2"
            onClick={() => onChange({ ...value, query: "" })}
            aria-label="مسح البحث"
          >
            <X />
          </Button>
        ) : null}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between">
            <span className="flex items-center gap-2">
              <Filter />
              تصفية الحالة
            </span>
            {value.statusGroups.length ? (
              <Badge variant="secondary">{value.statusGroups.length}</Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="flex w-max max-w-[calc(100vw-2rem)] flex-col gap-3 p-4"
          dir="rtl"
        >
          <fieldset className="flex flex-col gap-3">
            <legend className="font-medium">حالة الطلب</legend>
            <p className="text-sm text-muted-foreground">اختر حالة أو أكثر.</p>
            <Separator />
            <div className="flex flex-col gap-1">
              {STATUS_OPTIONS.map((option) => {
                const id = `request-status-${option.value}`;
                const selected = value.statusGroups.includes(option.value);
                return (
                  <Label
                    key={option.value}
                    htmlFor={id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2",
                      "hover:bg-accent hover:text-accent-foreground",
                      selected && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={selected}
                        onCheckedChange={() => toggleStatus(option.value)}
                      />
                      {option.label}
                    </span>
                    <Badge variant={selected ? "secondary" : "outline"}>
                      {countsByGroup.get(option.value) ?? 0}
                    </Badge>
                  </Label>
                );
              })}
            </div>
          </fieldset>
          {value.statusGroups.length ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...value, statusGroups: [] })}
            >
              مسح الفلاتر
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
