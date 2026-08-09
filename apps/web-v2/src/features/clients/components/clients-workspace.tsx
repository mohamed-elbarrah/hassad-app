"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2Icon } from "lucide-react";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  formatClientStage,
  formatMoney,
  type ClientDirectoryFilter,
  type ClientDirectorySort,
} from "@/features/clients/lib/client-directory";
import { useGetClientsWorkspaceQuery } from "@/lib/api/admin-workspaces-api";

export function ClientsWorkspace() {
  const [filter, setFilter] = useState<ClientDirectoryFilter>("all");
  const [sort, setSort] = useState<ClientDirectorySort>("highest-spend");

  const { data, error, isError, isLoading, refetch } = useGetClientsWorkspaceQuery({
    filter,
    sort,
  });
  const rows = data?.items ?? [];

  return (
    <PageScaffold
      title="Clients"
      description="Account portfolio view for active revenue, pipeline-only leads, and outstanding CRM or finance follow-up."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={[filter]}
            onValueChange={(value) => {
              const nextValue = value[0];

              if (
                nextValue === "all" ||
                nextValue === "clients" ||
                nextValue === "leads"
              ) {
                setFilter(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="clients">Clients</ToggleGroupItem>
            <ToggleGroupItem value="leads">Leads</ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={sort}
            onValueChange={(value) => {
              if (value === "highest-spend" || value === "lowest-spend") {
                setSort(value);
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
      <Card>
        <CardHeader>
          <CardTitle>Client portfolio</CardTitle>
          <CardDescription>
            Revenue-bearing clients and pipeline-only leads, ordered by spend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle="Loading clients"
              loadingDescription="Retrieving client portfolio health, ownership, and spend data from the admin API."
            />
          ) : isError && !data ? (
            <WorkspaceQueryState
              kind="error"
              error={error}
              onRetry={() => {
                void refetch();
              }}
            />
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
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/admin/clients/${row.id}`}
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
                      <StatusBadge tone={row.stageTone}>
                        {formatClientStage(row.stage)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.totalProjects}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.activeProjects}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.openOrders}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.pendingOffers}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.signedContracts}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(row.totalSpend)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(row.outstandingAmount)}
                    </TableCell>
                    <TableCell>{row.lastSeen}</TableCell>
                    <TableCell>{row.owner}</TableCell>
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
