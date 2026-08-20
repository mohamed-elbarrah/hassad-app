"use client";

import { FormInputControl } from "@/components/ui/formInputControl";
import {
  FormSelect,
  FormSelectContent,
  FormSelectItem,
  FormSelectTrigger,
  FormSelectValue,
} from "@/components/ui/formSelectControl";
import { ActionButton } from "@/components/design-system/ActionActionButton";
import { ClientStatus } from "@hassad/shared";
import type { ClientFilters } from "@/features/clients/clientsApi";

const STATUS_LABELS: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: "عميل محتمل",
  [ClientStatus.ACTIVE]: "نشط",
  [ClientStatus.STOPPED]: "متوقف",
};

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

  function handleReset() {
    onChange({ page: 1, limit: 20 });
  }

  const hasActiveFilters = !!(filters.search || filters.status);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <FormInputControl
        placeholder="ابحث بالاسم..."
        value={filters.search ?? ""}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-9 w-56"
      />

      {/* Status filter */}
      <FormSelect value={filters.status ?? "ALL"} onValueChange={handleStatus}>
        <FormSelectTrigger className="h-9 w-44">
          <FormSelectValue placeholder="كل الحالات" />
        </FormSelectTrigger>
        <FormSelectContent>
          <FormSelectItem value="ALL">كل الحالات</FormSelectItem>
          {(Object.values(ClientStatus) as ClientStatus[]).map((s) => (
            <FormSelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </FormSelectItem>
          ))}
        </FormSelectContent>
      </FormSelect>

      {/* Reset */}
      {hasActiveFilters && (
        <ActionButton variant="ghost" size="sm" onClick={handleReset}>
          مسح الفلاتر
        </ActionButton>
      )}
    </div>
  );
}
