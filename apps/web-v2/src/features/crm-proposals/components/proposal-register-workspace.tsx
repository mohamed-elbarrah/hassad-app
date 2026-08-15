"use client";

import Link from "next/link";
import { FileTextIcon } from "lucide-react";
import { LocalizedCurrency } from "@/components/patterns/localized-currency";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatProposalStatus, type ProposalDateFilter, type ProposalDirectoryFilter, type ProposalValueFilter, type ProposalDirectoryRecord } from "@/features/crm-proposals/lib/proposal-directory";
import type { describeApiError } from "@/lib/api/describe-api-error";
import { translateRequestLabel, useTranslations } from "@/lib/i18n";

export type ProposalWorkspaceRow = Omit<ProposalDirectoryRecord, "creator"> & {
  creator?: string;
};

export function ProposalRegisterWorkspace({
  title,
  description,
  rows,
  isLoading,
  isError,
  error,
  onRetry,
  statusFilter,
  dateFilter,
  valueFilter,
  onStatusFilterChange,
  onDateFilterChange,
  onValueFilterChange,
  basePath,
  showCreator = true,
}: {
  title: string;
  description: string;
  rows: ProposalWorkspaceRow[];
  isLoading: boolean;
  isError: boolean;
  error: Parameters<typeof describeApiError>[0];
  onRetry: () => void;
  statusFilter: ProposalDirectoryFilter;
  dateFilter: ProposalDateFilter;
  valueFilter: ProposalValueFilter;
  onStatusFilterChange: (value: ProposalDirectoryFilter) => void;
  onDateFilterChange: (value: ProposalDateFilter) => void;
  onValueFilterChange: (value: ProposalValueFilter) => void;
  basePath: string;
  showCreator?: boolean;
}) {
  const { locale, t } = useTranslations();
  return (
    <PageScaffold
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(value) => {
              const nextValue = value[0];

              if (
                nextValue === "all" ||
                nextValue === "sent" ||
                nextValue === "approved" ||
                nextValue === "revision-requested" ||
                nextValue === "rejected"
              ) {
                onStatusFilterChange(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">{t("all")}</ToggleGroupItem>
            <ToggleGroupItem value="sent">{t("sent")}</ToggleGroupItem>
            <ToggleGroupItem value="approved">{t("approved")}</ToggleGroupItem>
            <ToggleGroupItem value="revision-requested">{t("revisionRequested")}</ToggleGroupItem>
            <ToggleGroupItem value="rejected">{t("rejected")}</ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={dateFilter}
            onValueChange={(value) => {
              if (
                value === "all-time" ||
                value === "last-7-days" ||
                value === "last-30-days" ||
                value === "last-90-days"
              ) {
                onDateFilterChange(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("proposalsFilterDate")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-time">{t("allDates")}</SelectItem>
                <SelectItem value="last-7-days">{t("sentLast7")}</SelectItem>
                <SelectItem value="last-30-days">{t("sentLast30")}</SelectItem>
                <SelectItem value="last-90-days">{t("sentLast90")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={valueFilter}
            onValueChange={(value) => {
              if (
                value === "all-values" ||
                value === "under-15000" ||
                value === "15000-30000" ||
                value === "30000-50000" ||
                value === "50000-plus"
              ) {
                onValueFilterChange(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("proposalsFilterValue")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-values">All values</SelectItem>
                <SelectItem value="under-15000">Under $15k</SelectItem>
                <SelectItem value="15000-30000">$15k to $30k</SelectItem>
                <SelectItem value="30000-50000">$30k to $50k</SelectItem>
                <SelectItem value="50000-plus">$50k and above</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("proposalRegister")}</CardTitle>
          <CardDescription>
            {t("proposalRegisterDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !rows.length ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle={t("loadingProposals")}
              loadingDescription={t("loadingProposalsDescription")}
            />
          ) : isError && !rows.length ? (
            <WorkspaceQueryState kind="error" error={error} onRetry={onRetry} />
          ) : rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileTextIcon />
                </EmptyMedia>
                <EmptyTitle>{t("noProposals")}</EmptyTitle>
                <EmptyDescription>
                  {t("adjustProposalFilters")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("proposal")}</TableHead>
                  <TableHead>{t("clientRequest")}</TableHead>
                  {showCreator ? <TableHead>{t("creator")}</TableHead> : null}
                  <TableHead>{t("services")}</TableHead>
                  <TableHead className="text-right">{t("value")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("proposalSent")}</TableHead>
                  <TableHead>{t("proposalResponse")}</TableHead>
                  <TableHead>{t("proposalValidity")}</TableHead>
                  <TableHead>{t("proposalContract")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`${basePath}/${row.id}`} className="font-medium hover:underline">
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="font-medium">{row.clientName}</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {row.requestName}
                        </span>
                      </div>
                    </TableCell>
                    {showCreator ? <TableCell>{row.creator ?? "—"}</TableCell> : null}
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span>{row.servicesCount} {t("services").toLowerCase()}</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {row.servicesLabel}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <LocalizedCurrency amount={row.totalValue} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.statusTone}>
                        {translateRequestLabel(locale, formatProposalStatus(row.status))}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{translateRequestLabel(locale, row.sentAtLabel)}</TableCell>
                    <TableCell>{row.responseLabel}</TableCell>
                    <TableCell>
                      <StatusBadge tone={row.validityTone}>{translateRequestLabel(locale, row.validUntilLabel)}</StatusBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.contractTone}>{translateRequestLabel(locale, row.contractLabel)}</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
