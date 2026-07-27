"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCheck, Eye, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractStatus } from "@hassad/shared";
import type { ContractItem as ContractListItem } from "@/features/contracts/contractsApi";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { SalesStatusBadge } from "./shared/SalesStatusBadge";

/**
 * Cells-only renderer for the contracts queue.
 * The <tr> chrome is owned by `<DataTable>`; this only emits <td>s.
 */
export function renderContractRowCells(
  contract: ContractListItem,
): React.ReactNode[] {
  return [
    // Client name
    <td key="client" className="px-5 py-3.5 align-middle">
      <span className="text-sm font-medium text-natural-100">
        {contract.client?.companyName ?? contract.clientId}
      </span>
    </td>,

    // Total value
    <td key="totalValue" className="px-5 py-3.5 align-middle">
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {formatCurrency(contract.totalValue)}
      </span>
    </td>,

    // Period
    <td key="period" className="px-5 py-3.5 align-middle">
      <span className="text-sm text-portal-note-text">
        {formatShortDate(contract.startDate)} —{" "}
        {formatShortDate(contract.endDate)}
      </span>
    </td>,

    // Status
    <td key="status" className="px-5 py-3.5 align-middle">
      <SalesStatusBadge domain="contract" status={contract.status} />
    </td>,

    // Actions
    <td key="actions" className="px-5 py-3.5 align-middle text-start">
      <ContractActionsCell contract={contract} />
    </td>,
  ];
}

// ── Actions cell ─────────────────────────────────────────────────────────────

function ContractActionsCell({ contract }: { contract: ContractListItem }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopyLink(token: string | null | undefined, id: string) {
    if (!token) return;
    const url = `${window.location.origin}/contract/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("تم نسخ رابط التوقيع");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  }

  return (
    <div className="flex justify-end gap-2 items-center">
      <Button asChild size="icon" variant="ghost" className="size-8 rounded-lg" title="عرض العقد">
        <Link href={`/dashboard/sales/contracts/${contract.id}`}>
          <Eye className="size-4" />
        </Link>
      </Button>

      {contract.status === ContractStatus.SENT && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCopyLink(contract.shareLinkToken, contract.id)}
          disabled={!contract.shareLinkToken}
          title="نسخ رابط التوقيع للعميل"
          className="rounded-lg"
        >
          {copiedId === contract.id ? (
            <CheckCheck className="ml-1 size-4 text-success" />
          ) : (
            <Link2 className="ml-1 size-4" />
          )}
          {copiedId === contract.id ? "تم النسخ" : "نسخ الرابط"}
        </Button>
      )}
    </div>
  );
}
