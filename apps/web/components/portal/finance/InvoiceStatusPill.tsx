"use client";

import { StatusBadge } from "@/components/design-system/StatusBadge";
import { mapFinanceStatusToUI } from "@/lib/utils/statusMapping";

/**
 * Invoice status pill.
 *
 * Thin wrapper over the design-system `StatusBadge` — finance
 * statuses map cleanly onto the shared STATUS_MAP, so we don't
 * reinvent the visual. We only normalize the API status → UI
 * status here.
 */
interface InvoiceStatusPillProps {
  status: string;
}

export function InvoiceStatusPill({ status }: InvoiceStatusPillProps) {
  return <StatusBadge status={mapFinanceStatusToUI(status)} />;
}
