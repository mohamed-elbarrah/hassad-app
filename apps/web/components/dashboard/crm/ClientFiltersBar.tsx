"use client";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  CLIENT_KIND_AR,
  CLIENT_STATUS_AR,
  ClientKind,
  ClientStatus,
} from "@hassad/shared";
import type { ClientFilters } from "@/features/clients/clientsApi";

interface ClientFiltersBarProps {
  filters: ClientFilters;
  onChange: (filters: ClientFilters) => void;
}

export function ClientFiltersBar({ filters, onChange }: ClientFiltersBarProps) {
  function handleSearch(value: string) {
    onChange({ ...filters, search: value || undefined, page: 1 });
  }

  function handleStatus(value: string) {
    onChange({
      ...filters,
      status: value === "ALL" ? undefined : (value as ClientStatus),
      page: 1,
    });
  }

  function handleKind(value: string) {
    onChange({
      ...filters,
      kind: value === "ALL" ? undefined : (value as ClientKind),
      page: 1,
    });
  }

  function handleReset() {
    onChange({ page: 1, limit: 20 });
  }

  const hasActiveFilters = !!(filters.search || filters.status || filters.kind);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <Input
        placeholder="ابحث بالاسم..."
        value={filters.search ?? ""}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-9 w-56"
      />

      {/* Status filter */}
      <Select value={filters.status ?? "ALL"} onValueChange={handleStatus}>
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="كل الحالات" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">كل الحالات</SelectItem>
          {(Object.values(ClientStatus) as ClientStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {CLIENT_STATUS_AR[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.kind ?? "ALL"} onValueChange={handleKind}>
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="كل الأنواع" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">كل الأنواع</SelectItem>
          {(Object.values(ClientKind) as ClientKind[]).map((kind) => (
            <SelectItem key={kind} value={kind}>
              {CLIENT_KIND_AR[kind]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {hasActiveFilters && (
        <ActionButton variant="ghost" size="sm" onClick={handleReset}>
          مسح الفلاتر
        </ActionButton>
      )}
    </div>
  );
}
