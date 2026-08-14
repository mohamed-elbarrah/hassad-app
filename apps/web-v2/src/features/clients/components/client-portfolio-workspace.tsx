"use client";

import Link from "next/link";
import { Building2Icon } from "lucide-react";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import type { describeApiError } from "@/lib/api/describe-api-error";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatClientStage, formatMoney, type ClientDirectoryFilter, type ClientDirectorySort } from "@/features/clients/lib/client-directory";

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

              if (nextValue === "all" || nextValue === "clients" || nextValue === "requests") {
                onFilterChange(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="clients">Clients</ToggleGroupItem>
            <ToggleGroupItem value="requests">Requests</ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={sort}
            onValueChange={(value) => {
              if (value === "highest-spend" || value === "lowest-spend") {
                onSortChange(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Sort clients">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="highest-spend">Highest spend</SelectItem>
                <SelectItem value="lowest-spend">Lowest spend</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">Client portfolio</h2>
          <p className="text-sm text-muted-foreground">
            Revenue-bearing clients and pipeline-only leads, ordered by spend.
          </p>
        </div>
        <div className="p-6">
          {isLoading && !rows.length ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle={`Loading ${title.toLowerCase()}`}
              loadingDescription="Retrieving client portfolio health and spend data from the workspace API."
            />
          ) : isError && !rows.length ? (
            <WorkspaceQueryState kind="error" error={error} onRetry={onRetry} />
          ) : rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2Icon />
                </EmptyMedia>
                <EmptyTitle>No clients in this segment</EmptyTitle>
                <EmptyDescription>
                  Adjust the filter or sort to inspect another client segment.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total projects</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Open orders</TableHead>
                  <TableHead className="text-right">Pending offers</TableHead>
                  <TableHead className="text-right">Signed contracts</TableHead>
                  <TableHead className="text-right">Total spend</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Last seen</TableHead>
                  {showOwner ? <TableHead>Owner</TableHead> : null}
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
                      <StatusBadge tone={row.stageTone}>{formatClientStage(row.stage)}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{row.totalProjects}</TableCell>
                    <TableCell className="text-right font-medium">{row.activeProjects}</TableCell>
                    <TableCell className="text-right font-medium">{row.openOrders}</TableCell>
                    <TableCell className="text-right font-medium">{row.pendingOffers}</TableCell>
                    <TableCell className="text-right font-medium">{row.signedContracts}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(row.totalSpend)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(row.outstandingAmount)}
                    </TableCell>
                    <TableCell>{row.lastSeen}</TableCell>
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
