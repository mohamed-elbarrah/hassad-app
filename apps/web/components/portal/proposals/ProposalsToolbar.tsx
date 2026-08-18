"use client";

import { Filter, Search, X } from "lucide-react";
import { ProposalStatus } from "@hassad/shared";
import { cn } from "@/lib/utils";
import type { ProposalListItem } from "@/features/proposals/proposalsApi";
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

const OPTIONS = [
  { value: ProposalStatus.SENT, label: "بانتظار المراجعة" },
  { value: ProposalStatus.REVISION_REQUESTED, label: "مطلوب تعديلات" },
  { value: ProposalStatus.APPROVED, label: "معتمد" },
  { value: ProposalStatus.DRAFT, label: "مسودة" },
  { value: ProposalStatus.REJECTED, label: "مرفوض" },
];
export function ProposalsToolbar({
  search,
  onSearchChange,
  activeFilters,
  onFilterChange,
  proposals,
  visibleCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  proposals: ProposalListItem[] | undefined;
  visibleCount: number;
  totalCount: number;
}) {
  const selected = activeFilters.status ?? [];
  const toggle = (value: string) =>
    onFilterChange(
      "status",
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      dir="rtl"
    >
      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9 pe-9"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث باسم العرض أو الشركة..."
        />
        {search ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute end-1 top-1/2 size-8 -translate-y-1/2"
            onClick={() => onSearchChange("")}
          >
            <X />
          </Button>
        ) : null}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <Filter />
            الحالة
            {selected.length ? (
              <Badge variant="secondary">{selected.length}</Badge>
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
          <div>
            <p className="font-medium">حالة العرض</p>
            <p className="text-sm text-muted-foreground">اختر حالة أو أكثر.</p>
          </div>
          <Separator />
          {OPTIONS.map((option) => {
            const id = `proposal-${option.value}`;
            return (
              <Label
                key={option.value}
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2",
                  "hover:bg-accent hover:text-accent-foreground",
                  selected.includes(option.value) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                <Checkbox
                  id={id}
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggle(option.value)}
                />
                {option.label}
                <Badge variant="outline">
                  {proposals?.filter(
                    (proposal) => proposal.status === option.value,
                  ).length ?? 0}
                </Badge>
              </Label>
            );
          })}
          {selected.length ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange("status", [])}
            >
              مسح الفلاتر
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
      <span className="text-sm text-muted-foreground">{visibleCount} عرض</span>
    </div>
  );
}
