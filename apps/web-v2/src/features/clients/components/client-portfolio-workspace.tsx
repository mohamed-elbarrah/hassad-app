"use client";

import Link from "next/link";
import { Building2Icon } from "lucide-react";
import { LocalizedCurrency } from "@/components/patterns/localized-currency";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import type { describeApiError } from "@/lib/api/describe-api-error";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatClientStage, type ClientDirectoryFilter, type ClientDirectorySort } from "@/features/clients/lib/client-directory";
import { translateClientLabel, useTranslations } from "@/lib/i18n";

export type ClientPortfolioRow = {
  id: string;
  contactName: string;
  companyName: string;
  stage: "lead" | "active" | "completed";
  totalProjects: number;
  activeProjects: number;
  openOrders: number;
  pendingOffers: number;
  signedContracts: number;
  totalSpend: number;
  outstandingAmount: number;
  lastSeen: string;
  owner?: string;
  stageTone: "success" | "warning" | "neutral" | "active" | "attention" | "destructive";
  financeTone: "success" | "warning" | "neutral" | "active" | "attention" | "destructive";
};

export function ClientPortfolioWorkspace({
  title,
  description,
  rows,
  isLoading,
  isError,
  error,
  onRetry,
  filter,
  sort,
  onFilterChange,
  onSortChange,
  basePath,
  showOwner,
}: {
  title: string;
  description: string;
  rows: ClientPortfolioRow[];
  isLoading: boolean;
  isError: boolean;
  error: Parameters<typeof describeApiError>[0];
  onRetry: () => void;
  filter: ClientDirectoryFilter;
  sort: ClientDirectorySort;
  onFilterChange: (filter: ClientDirectoryFilter) => void;
  onSortChange: (sort: ClientDirectorySort) => void;
  basePath: string;
  showOwner: boolean;
}) {
  const { locale, t } = useTranslations();
  return (
    <PageScaffold
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={[filter]}
            onValueChange={(value) => {
              const nextValue = value[0];

              if (nextValue === "all" || nextValue === "clients" || nextValue === "leads") {
                onFilterChange(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">{t("all")}</ToggleGroupItem>
            <ToggleGroupItem value="clients">{t("clients")}</ToggleGroupItem>
            <ToggleGroupItem value="leads">{t("leads")}</ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={sort}
            onValueChange={(value) => {
              if (value === "highest-spend" || value === "lowest-spend") {
                onSortChange(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t("sortClients")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="highest-spend">{t("highestSpend")}</SelectItem>
                <SelectItem value="lowest-spend">{t("lowestSpend")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">{t("clientPortfolio")}</h2>
          <p className="text-sm text-muted-foreground">{t("clientPortfolioDescription")}</p>
        </div>
        <div className="p-6">
          {isLoading && !rows.length ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle={t("loadingClients")}
              loadingDescription={t("loadingClientsDescription")}
            />
          ) : isError && !rows.length ? (
            <WorkspaceQueryState kind="error" error={error} onRetry={onRetry} />
          ) : rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2Icon />
                </EmptyMedia>
                <EmptyTitle>{t("noClientsSegment")}</EmptyTitle>
                <EmptyDescription>
                  {t("adjustClientFilter")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("client")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead className="text-right">{t("totalProjects")}</TableHead>
                  <TableHead className="text-right">{t("active")}</TableHead>
                  <TableHead className="text-right">{t("openOrders")}</TableHead>
                  <TableHead className="text-right">{t("pendingOffers")}</TableHead>
                  <TableHead className="text-right">{t("signedContracts")}</TableHead>
                  <TableHead className="text-right">{t("value")}</TableHead>
                  <TableHead className="text-right">{t("outstanding")}</TableHead>
                  <TableHead>{t("lastSeen")}</TableHead>
                  {showOwner ? <TableHead>{t("owner")}</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`${basePath}/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.contactName}
                        </Link>
                        <span className="truncate text-sm text-muted-foreground">
                          {row.companyName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.stageTone}>{translateClientLabel(locale, formatClientStage(row.stage))}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{row.totalProjects}</TableCell>
                    <TableCell className="text-right font-medium">{row.activeProjects}</TableCell>
                    <TableCell className="text-right font-medium">{row.openOrders}</TableCell>
                    <TableCell className="text-right font-medium">{row.pendingOffers}</TableCell>
                    <TableCell className="text-right font-medium">{row.signedContracts}</TableCell>
                    <TableCell className="text-right font-medium">
                      <LocalizedCurrency amount={row.totalSpend} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <LocalizedCurrency amount={row.outstandingAmount} />
                    </TableCell>
                    <TableCell>{translateClientLabel(locale, row.lastSeen)}</TableCell>
                    {showOwner ? <TableCell>{row.owner ?? "—"}</TableCell> : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </PageScaffold>
  );
}
