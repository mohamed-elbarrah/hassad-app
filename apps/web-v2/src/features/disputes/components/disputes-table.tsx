"use client";

import Link from "next/link";
import { translateRequestLabel, useTranslations } from "@/lib/i18n";

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
  const { locale, t } = useTranslations();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("dispute")}</TableHead>
          <TableHead>{t("client")}</TableHead>
          <TableHead>{t("project")}</TableHead>
          {showPm ? <TableHead>{t("pm")}</TableHead> : null}
          <TableHead>{t("category")}</TableHead>
          <TableHead>{t("priority")}</TableHead>
          <TableHead>{t("state")}</TableHead>
          <TableHead>{t("lastActivity")}</TableHead>
          <TableHead>{t("signal")}</TableHead>
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
            <TableCell>{translateRequestLabel(locale, formatDisputeCategory(row.category))}</TableCell>
            <TableCell>
              <StatusBadge tone={getDisputePriorityTone(row.priority)}>
                {translateRequestLabel(locale, formatDisputePriority(row.priority))}
              </StatusBadge>
            </TableCell>
            <TableCell>
              <StatusBadge tone={getDisputeStatusTone(row.status)}>
                {translateRequestLabel(locale, formatDisputeStatus(row.status))}
              </StatusBadge>
            </TableCell>
            <TableCell>{translateRequestLabel(locale, row.lastActivityLabel)}</TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <div>
                  <StatusBadge tone={row.signalTone}>{translateRequestLabel(locale, row.signalLabel)}</StatusBadge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {translateRequestLabel(locale, row.signalSummary)}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
