"use client";

import { SalesStatusBadge } from "./shared/SalesStatusBadge";
import { formatShortDate } from "@/lib/format";
import type { Client } from "@hassad/shared";

/**
 * Cells-only renderer for the clients queue.
 * The <tr> chrome is owned by `<DataTable>`; this only emits <td>s.
 */
export function renderClientRowCells(client: Client): React.ReactNode[] {
  return [
    // Company name
    <td key="companyName" className="px-5 py-3.5 align-middle">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-natural-100">
          {client.companyName}
        </span>
        {client.businessName && (
          <span className="text-xs text-portal-note-text">
            {client.businessName}
          </span>
        )}
      </div>
    </td>,

    // Contact name
    <td key="contactName" className="px-5 py-3.5 align-middle">
      <span className="text-sm text-natural-100">
        {client.user?.name ?? "—"}
      </span>
    </td>,

    // Phone
    <td key="phone" className="px-5 py-3.5 align-middle">
      <span className="text-sm font-mono text-natural-100" dir="ltr">
        {client.user?.phoneWhatsapp ?? "—"}
      </span>
    </td>,

    // Email
    <td key="email" className="px-5 py-3.5 align-middle">
      <span className="text-sm font-mono text-portal-note-text" dir="ltr">
        {client.user?.email ?? "—"}
      </span>
    </td>,

    // Status
    <td key="status" className="px-5 py-3.5 align-middle">
      <SalesStatusBadge domain="client" status={client.status} />
    </td>,

    // Projects
    <td key="projects" className="px-5 py-3.5 align-middle">
      <span className="text-sm text-natural-100">
        {client.totalProjects ?? 0}
      </span>
      {(client.activeProjects ?? 0) > 0 && (
        <span className="text-xs text-portal-note-text mr-1">
          ({client.activeProjects} نشط)
        </span>
      )}
    </td>,

    // Account manager
    <td key="manager" className="px-5 py-3.5 align-middle">
      <span className="text-sm text-portal-note-text">
        {client.manager?.name ?? "—"}
      </span>
    </td>,

    // Last activity
    <td key="lastActivity" className="px-5 py-3.5 align-middle">
      <span className="text-sm text-portal-note-text">
        {formatShortDate(client.lastProjectAt)}
      </span>
    </td>,

    // Created date
    <td key="createdAt" className="px-5 py-3.5 align-middle">
      <span className="text-sm text-portal-note-text">
        {formatShortDate(client.createdAt)}
      </span>
    </td>,
  ];
}
