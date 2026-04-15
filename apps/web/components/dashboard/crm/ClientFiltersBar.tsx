"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ClientStatus,
  PipelineStage,
  PIPELINE_STAGE_ORDER,
} from "@hassad/shared";
import type { ClientFilters } from "@/features/clients/clientsApi";

const STATUS_LABELS: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: "عميل محتمل",
  [ClientStatus.ACTIVE]: "نشط",
  [ClientStatus.STOPPED]: "متوقف",
};

const STAGE_LABELS: Record<PipelineStage, string> = {
  [PipelineStage.NEW_LEAD]: "عميل جديد",
  [PipelineStage.CONTACTED]: "تم التواصل",
  [PipelineStage.MEETING_SCHEDULED]: "اجتماع محدد",
  [PipelineStage.REQUIREMENTS_GATHERING]: "جمع المتطلبات",
  [PipelineStage.PROPOSAL_SENT]: "تم إرسال العرض",
  [PipelineStage.NEGOTIATION]: "التفاوض",
  [PipelineStage.CONTRACT_SIGNED]: "تم توقيع العقد",
  [PipelineStage.FIRST_PAYMENT]: "الدفعة الأولى",
  [PipelineStage.TRANSFERRED_TO_OPERATIONS]: "تم التحويل للعمليات",
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

  function handleStage(value: string) {
    onChange({
      ...filters,
      stage: value === "ALL" ? undefined : (value as PipelineStage),
      page: 1,
    });
  }

  function handleReset() {
    onChange({ page: 1, limit: 20 });
  }

  const hasActiveFilters = !!(
    filters.search ||
    filters.status ||
    filters.stage
  );

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
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Stage filter */}
      <Select value={filters.stage ?? "ALL"} onValueChange={handleStage}>
        <SelectTrigger className="h-9 w-52">
          <SelectValue placeholder="كل المراحل" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">كل المراحل</SelectItem>
          {PIPELINE_STAGE_ORDER.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          مسح الفلاتر
        </Button>
      )}
    </div>
  );
}
