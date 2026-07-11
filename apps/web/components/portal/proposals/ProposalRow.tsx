"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { cn } from "@/lib/utils";
import type { ProposalListItem } from "@/features/proposals/proposalsApi";
import { DomainStatusPill } from "@/components/portal/shared/DomainStatusPill";
import { formatShortDateLong } from "@/lib/format";

/**
 * Cells-only renderer for the proposals queue. The <tr> chrome
 * is owned by `<DataTable>`; this only emits <td>s.
 */
export function renderProposalRowCells(
  proposal: ProposalListItem,
  _helpers: { onActivate?: () => void },
): React.ReactNode[] {
  const isActionable = proposal.status === "SENT";
  const company =
    proposal.lead?.companyName ?? proposal.request?.companyName ?? "—";
  const sentAt = formatShortDateLong(proposal.sentAt ?? proposal.createdAt);
  const href = proposal.shareLinkToken
    ? `/portal/proposals/${proposal.shareLinkToken}`
    : null;

  return [
    <td key="title" className="px-5 py-3.5 align-middle">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "bg-action-purple-soft text-action-purple",
          )}
          aria-hidden="true"
        >
          <FileText className="h-4 w-4" />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-natural-100 truncate max-w-[280px]">
            {proposal.title}
          </span>
          <span className="text-xs text-portal-note-text truncate max-w-[280px]">
            {company}
          </span>
        </div>
      </div>
    </td>,
    <td key="price" className="px-5 py-3.5 align-middle">
      <CurrencyDisplay
        amount={proposal.totalPrice}
        size="sm"
        className="text-sm font-semibold text-natural-100 tabular-nums"
      />
    </td>,
    <td key="sentDate" className="px-5 py-3.5 align-middle">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-portal-note-text tabular-nums">
        <Calendar className="h-3.5 w-3.5" />
        {sentAt}
      </span>
    </td>,
    <td key="status" className="px-5 py-3.5 align-middle">
      <DomainStatusPill domain="proposal" status={proposal.status} />
    </td>,
    <td key="action" className="px-5 py-3.5 align-middle text-start w-[150px]">
      {href ? (
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="inline-block"
        >
          <ActionButton
            variant={isActionable ? "primary" : "outline"}
            size="md"
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
            className="h-8"
          >
            {isActionable ? "مراجعة العرض" : "فتح العرض"}
          </ActionButton>
        </Link>
      ) : (
        <span className="text-[12px] text-portal-note-text">غير متاح</span>
      )}
    </td>,
  ];
}
