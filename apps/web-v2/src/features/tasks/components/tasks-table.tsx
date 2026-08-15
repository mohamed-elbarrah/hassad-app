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
  formatTaskDepartment,
  formatTaskPriority,
  formatTaskStatus,
  getTaskPriorityTone,
  getTaskStatusTone,
  type TaskDirectoryRecord,
} from "@/features/tasks/lib/task-directory";

type TasksTableProps = {
  rows: TaskDirectoryRecord[];
  hrefBase?: string;
};

export function TasksTable({ rows, hrefBase = "/admin/tasks" }: TasksTableProps) {
  const { locale, t } = useTranslations();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("task")}</TableHead>
          <TableHead>{t("project")}</TableHead>
          <TableHead>{t("department")}</TableHead>
          <TableHead>{t("assignee")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("priority")}</TableHead>
          <TableHead>{t("due")}</TableHead>
          <TableHead>{t("period")}</TableHead>
          <TableHead>{t("client")}</TableHead>
          <TableHead>{t("signal")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <Link
                  href={`${hrefBase}/${row.id}`}
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
            <TableCell>{translateRequestLabel(locale, formatTaskDepartment(row.department))}</TableCell>
            <TableCell>
              <span
                className={
                  row.assigneeName ? "font-medium" : "text-muted-foreground"
                }
              >
                {row.assigneeName ?? t("noAssignee")}
              </span>
            </TableCell>
            <TableCell>
              <StatusBadge tone={getTaskStatusTone(row.status)}>
                {translateRequestLabel(locale, formatTaskStatus(row.status))}
              </StatusBadge>
            </TableCell>
            <TableCell>
              <StatusBadge tone={getTaskPriorityTone(row.priority)}>
                {translateRequestLabel(locale, formatTaskPriority(row.priority))}
              </StatusBadge>
            </TableCell>
            <TableCell>{translateRequestLabel(locale, row.dueDateLabel)}</TableCell>
            <TableCell>{row.periodLabel}</TableCell>
            <TableCell>
              <StatusBadge tone={row.isClientVisible ? "active" : "neutral"}>
                {row.isClientVisible ? t("visible") : t("internal")}
              </StatusBadge>
            </TableCell>
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
