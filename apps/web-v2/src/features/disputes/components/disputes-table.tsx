"use client";

import Link from "next/link";

import { StatusBadge } from "@/components/patterns/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDisputeCategory,
  formatDisputePriority,
  formatDisputeStatus,
  getDisputePriorityTone,
  getDisputeStatusTone,
  type DisputeDirectoryRecord,
} from "@/features/disputes/lib/dispute-directory";

type DisputesTableProps = {
  rows: DisputeDirectoryRecord[];
  detailHrefBase?: string;
  showPm?: boolean;
};

export function DisputesTable({
  rows,
  detailHrefBase = "/admin/disputes",
  showPm = true,
}: DisputesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dispute</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Project</TableHead>
          {showPm ? <TableHead>PM</TableHead> : null}
          <TableHead>Category</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Last activity</TableHead>
          <TableHead>Signal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`${detailHrefBase}/${row.id}`}
                  className="font-medium hover:underline"
                >
                  {row.title}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {row.ticketNumber} · {row.openedAtLabel}
                </span>
              </div>
            </TableCell>
            <TableCell>{row.clientName}</TableCell>
            <TableCell>{row.projectName}</TableCell>
            {showPm ? <TableCell>{row.pmName}</TableCell> : null}
            <TableCell>{formatDisputeCategory(row.category)}</TableCell>
            <TableCell>
              <StatusBadge tone={getDisputePriorityTone(row.priority)}>
                {formatDisputePriority(row.priority)}
              </StatusBadge>
            </TableCell>
            <TableCell>
              <StatusBadge tone={getDisputeStatusTone(row.status)}>
                {formatDisputeStatus(row.status)}
              </StatusBadge>
            </TableCell>
            <TableCell>{row.lastActivityLabel}</TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <div>
                  <StatusBadge tone={row.signalTone}>{row.signalLabel}</StatusBadge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {row.signalSummary}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
