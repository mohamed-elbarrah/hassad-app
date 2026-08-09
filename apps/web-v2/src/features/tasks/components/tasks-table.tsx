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
  formatTaskDepartment,
  formatTaskPriority,
  formatTaskStatus,
  getTaskPriorityTone,
  getTaskStatusTone,
  type TaskDirectoryRecord,
} from "@/features/tasks/lib/task-directory";

type TasksTableProps = {
  rows: TaskDirectoryRecord[];
};

export function TasksTable({ rows }: TasksTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Signal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`/admin/tasks/${row.id}`}
                  className="font-medium hover:underline"
                >
                  {row.title}
                </Link>
                <span className="truncate text-sm text-muted-foreground">
                  {row.id}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium">{row.projectName}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {row.clientName}
                </span>
              </div>
            </TableCell>
            <TableCell>{formatTaskDepartment(row.department)}</TableCell>
            <TableCell>
              <span
                className={
                  row.assigneeName ? "font-medium" : "text-muted-foreground"
                }
              >
                {row.assigneeName ?? "No assignee"}
              </span>
            </TableCell>
            <TableCell>
              <StatusBadge tone={getTaskStatusTone(row.status)}>
                {formatTaskStatus(row.status)}
              </StatusBadge>
            </TableCell>
            <TableCell>
              <StatusBadge tone={getTaskPriorityTone(row.priority)}>
                {formatTaskPriority(row.priority)}
              </StatusBadge>
            </TableCell>
            <TableCell>{row.dueDateLabel}</TableCell>
            <TableCell>{row.periodLabel}</TableCell>
            <TableCell>
              <StatusBadge tone={row.isClientVisible ? "active" : "neutral"}>
                {row.isClientVisible ? "Visible" : "Internal"}
              </StatusBadge>
            </TableCell>
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
