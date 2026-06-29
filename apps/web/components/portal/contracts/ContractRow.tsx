"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { cn } from "@/lib/utils";
import type { PortalContractSummary } from "@/features/portal/portalApi";
import { DomainStatusPill } from "@/components/portal/shared/DomainStatusPill";
import { contractTypeLabel } from "@/lib/i18n";
import { formatShortDateLong } from "@/lib/format";

interface ContractRowProps {
  contract: PortalContractSummary & { type?: string };
  onSelect?: (id: string) => void;
}

/**
 * Cells-only renderer for the contracts queue. The <tr> chrome
 * is owned by `<DataTable>`; this only emits <td>s.
 */
export function renderContractRowCells(
  contract: PortalContractSummary & { type?: string },
  _helpers: { onActivate?: () => void },
): React.ReactNode[] {
  const isActionable = contract.status === "SENT";
  const period = formatPeriod(contract.startDate, contract.endDate);
  const href = `/portal/contracts/${contract.id}`;

  return [
    <td key="title" className="px-5 py-3.5 align-middle">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "bg-action-blue-soft text-action-blue",
          )}
          aria-hidden="true"
        >
          <FileText className="h-4 w-4" />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-natural-100 truncate max-w-[280px]">
            {contract.title}
          </span>
          <span className="text-xs text-portal-note-text">
            {contract.type ? contractTypeLabel(contract.type) : "عقد"}
          </span>
        </div>
      </div>
    </td>,
    <td key="value" className="px-5 py-3.5 align-middle">
      <CurrencyDisplay
        amount={contract.totalValue}
        size="sm"
        className="text-sm font-semibold text-natural-100 tabular-nums"
      />
    </td>,
    <td key="period" className="px-5 py-3.5 align-middle">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-portal-note-text tabular-nums">
        <Calendar className="h-3.5 w-3.5" />
        {period}
      </span>
    </td>,
    <td key="status" className="px-5 py-3.5 align-middle">
      <DomainStatusPill domain="contract" status={contract.status} />
    </td>,
    <td key="manager" className="px-5 py-3.5 align-middle text-sm text-portal-note-text">
      {contract.projectManager ?? "غير معين"}
    </td>,
    <td key="action" className="px-5 py-3.5 align-middle text-start w-[150px]">
      <Link href={href} onClick={(e) => e.stopPropagation()} className="inline-block">
        <ActionButton
          variant={isActionable ? "primary" : "outline"}
          size="md"
          icon={<ArrowLeft className="h-3.5 w-3.5" />}
          className="h-8"
        >
          {isActionable ? "توقيع العقد" : "استعراض العقد"}
        </ActionButton>
      </Link>
    </td>,
  ];
}

function formatPeriod(
  start?: string | null,
  end?: string | null,
): string {
  const s = formatShortDateLong(start);
  const e = formatShortDateLong(end);
  if (s === "—" && e === "—") return "—";
  if (s !== "—" && e !== "—") return `${s} — ${e}`;
  return s !== "—" ? s : e;
}