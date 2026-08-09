"use client";

import Link from "next/link";

import {
  Progress,
} from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/patterns/status-badge";
import {
  formatProjectDepartments,
  formatMoney,
  formatProjectStatus,
  formatTimeline,
  type ProjectDirectoryRecord,
} from "@/features/projects/lib/project-directory";

type ProjectsTableProps = {
  rows: ProjectDirectoryRecord[];
};

export function ProjectsTable({ rows }: ProjectsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>PM</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Current period</TableHead>
          <TableHead>Health</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Timeline</TableHead>
          <TableHead className="text-right">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`/admin/projects/${row.id}`}
                  className="font-medium hover:underline"
                >
                  {row.name}
                </Link>
                <span className="truncate text-sm text-muted-foreground">
                  {row.model === "recurring" ? "Recurring retainer" : "One-off project"} ·{" "}
                  {row.priority.toLowerCase()} priority
                </span>
              </div>
            </TableCell>
            <TableCell>{row.clientName}</TableCell>
            <TableCell>{row.projectManager}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={row.statusTone}>
                  {formatProjectStatus(row.status)}
                </StatusBadge>
                {row.archived ? (
                  <StatusBadge tone={row.archivedTone}>Archived</StatusBadge>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-40 flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{row.completionPercentage}% complete</span>
                  <span className="text-muted-foreground">
                    {row.completionPercentage}%
                  </span>
                </div>
                <Progress value={row.completionPercentage} />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium">{row.currentPeriodLabel}</span>
                <div>
                  <StatusBadge tone={row.currentPeriodStatusTone}>
                    {row.currentPeriodStatusLabel}
                  </StatusBadge>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <div>
                  <StatusBadge tone={row.healthTone}>{row.healthLabel}</StatusBadge>
                </div>
                <span className="font-medium">{row.healthSummary}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium">{row.teamSize} members + PM</span>
                <span className="text-sm text-muted-foreground">
                  {formatProjectDepartments(row.assignedDepartments)}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <span>
                  {row.startDate} to {row.endDate}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatTimeline(row.daysToEnd, row.endDate)}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex min-w-28 flex-col gap-1">
                <span className="font-medium">{formatMoney(row.totalValue)}</span>
                <span className="text-sm text-muted-foreground">
                  {formatMoney(row.remainingValue)} remaining
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
