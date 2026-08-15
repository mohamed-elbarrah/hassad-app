"use client";

import Link from "next/link";
import { LocalizedCurrency } from "@/components/patterns/localized-currency";

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
  formatProjectStatus,
  formatTimeline,
  type ProjectDirectoryRecord,
} from "@/features/projects/lib/project-directory";
import { translateRequestLabel, useTranslations } from "@/lib/i18n";

type ProjectsTableProps = {
  rows: ProjectDirectoryRecord[];
};

export function ProjectsTable({ rows }: ProjectsTableProps) {
  const { locale, t } = useTranslations();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("project")}</TableHead>
          <TableHead>{t("client")}</TableHead>
          <TableHead>{t("pm")}</TableHead>
          <TableHead>{t("projectState")}</TableHead>
          <TableHead>{t("progress")}</TableHead>
          <TableHead>{t("currentPeriod")}</TableHead>
          <TableHead>{t("health")}</TableHead>
          <TableHead>{t("team")}</TableHead>
          <TableHead>{t("timeline")}</TableHead>
          <TableHead className="text-right">{t("value")}</TableHead>
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
                  {translateRequestLabel(locale, row.model === "recurring" ? "Monthly retainer" : "One-off delivery")} · {translateRequestLabel(locale, row.priority.toLowerCase())} {t("priority")}
                </span>
              </div>
            </TableCell>
            <TableCell>{row.clientName}</TableCell>
            <TableCell>{row.projectManager}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={row.statusTone}>
                  {translateRequestLabel(locale, formatProjectStatus(row.status))}
                </StatusBadge>
                {row.archived ? (
                  <StatusBadge tone={row.archivedTone}>{t("archived")}</StatusBadge>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-40 flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{row.completionPercentage}% {t("complete")}</span>
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
                    {translateRequestLabel(locale, row.currentPeriodStatusLabel)}
                  </StatusBadge>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <div>
                  <StatusBadge tone={row.healthTone}>{translateRequestLabel(locale, row.healthLabel)}</StatusBadge>
                </div>
                <span className="font-medium">{translateRequestLabel(locale, row.healthSummary)}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium">{row.teamSize} {t("members")}</span>
                <span className="text-sm text-muted-foreground">
                  {translateRequestLabel(locale, formatProjectDepartments(row.assignedDepartments))}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex min-w-0 flex-col gap-1">
                <span>
                  {translateRequestLabel(locale, row.startDate)} {locale === "ar" ? "إلى" : "to"} {translateRequestLabel(locale, row.endDate)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {translateRequestLabel(locale, formatTimeline(row.daysToEnd, row.endDate))}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex min-w-28 flex-col gap-1">
                <span className="font-medium"><LocalizedCurrency amount={row.totalValue} /></span>
                <span className="text-sm text-muted-foreground">
                  <LocalizedCurrency amount={row.remainingValue} /> {t("remaining")}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
