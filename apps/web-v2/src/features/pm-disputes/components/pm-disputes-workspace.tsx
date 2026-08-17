"use client";

import { useMemo, useState } from "react";
import { ShieldAlertIcon, RefreshCcwIcon } from "lucide-react";
import { DisputeCategory, DisputePriority, DisputeStatus } from "@hassad/shared";

import { MetricTile } from "@/components/patterns/metric-tile";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DisputesTable } from "@/features/disputes/components/disputes-table";
import { formatDisputeCategory, formatDisputePriority, formatDisputeStatus, type DisputeDirectoryRecord, type DisputeQueueFilter, type DisputeStaleFilter } from "@/features/disputes/lib/dispute-directory";
import { mapPmDisputeListItem } from "@/features/pm-disputes/lib/pm-dispute-mappers";
import { useGetPmDisputesQuery, useGetPmDisputeStatsQuery } from "@/lib/api/pm-disputes-api";

const quickQueueLabels: Array<{ value: DisputeQueueFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending-approval", label: "Pending approval" },
  { value: "escalated", label: "Escalated" },
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
];

export function PmDisputesWorkspace() {
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<DisputeQueueFilter>("all");
  const [status, setStatus] = useState<DisputeStatus | "all-statuses">("all-statuses");
  const [category, setCategory] = useState<DisputeCategory | "all-categories">("all-categories");
  const [priority, setPriority] = useState<DisputePriority | "all-priorities">("all-priorities");
  const [stale, setStale] = useState<DisputeStaleFilter>("all-activity");

  const disputesQuery = useGetPmDisputesQuery({
    page: 1,
    limit: 100,
    status: status === "all-statuses" ? undefined : status,
    category: category === "all-categories" ? undefined : category,
    priority: priority === "all-priorities" ? undefined : priority,
  });

  const statsQuery = useGetPmDisputeStatsQuery();

  const rows = useMemo<DisputeDirectoryRecord[]>(() => {
    const mappedRows = (disputesQuery.data?.data ?? []).map(mapPmDisputeListItem);
    const query = search.trim().toLowerCase();

    return mappedRows
      .filter((row) => {
        if (!query) return true;

        return [
          row.ticketNumber,
          row.title,
          row.clientName,
          row.projectName,
          row.pmName,
          formatDisputeCategory(row.category),
          formatDisputeStatus(row.status),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .filter((row) => {
        if (queue === "pending-approval") return row.status === DisputeStatus.PENDING_APPROVAL;
        if (queue === "escalated") return row.status === DisputeStatus.ESCALATED;
        if (queue === "active") {
          return [DisputeStatus.APPROVED, DisputeStatus.IN_PROGRESS, DisputeStatus.PENDING_CLIENT].includes(row.status);
        }
        if (queue === "resolved") {
          return [DisputeStatus.RESOLVED, DisputeStatus.CLOSED].includes(row.status);
        }
        return true;
      })
      .filter((row) => {
        if (stale === "stale-3-days") return row.staleDays >= 3;
        if (stale === "stale-7-days") return row.staleDays >= 7;
        return true;
      });
  }, [disputesQuery.data?.data, queue, search, stale]);

  const isLoading = disputesQuery.isLoading && !disputesQuery.data;
  const isError = disputesQuery.isError && !disputesQuery.data;

  return (
    <PageScaffold
      title="PM Disputes"
      description="Assigned disputes that need client follow-up, PM coordination, or a resolution handoff back to the client confirmation step."
      actions={
        <Button type="button" variant="outline" onClick={() => void disputesQuery.refetch()}>
          <RefreshCcwIcon data-icon="inline-start" />
          Refresh
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Assigned"
          value={String(statsQuery.data?.totalDisputes ?? rows.length)}
          description="Disputes currently owned by this PM."
        />
        <MetricTile
          label="Resolved"
          value={String(statsQuery.data?.resolvedDisputes ?? 0)}
          description="Cases that already reached resolution."
        />
        <MetricTile
          label="Escalated"
          value={String(statsQuery.data?.escalatedDisputes ?? 0)}
          description="Cases that moved into escalation."
        />
        <MetricTile
          label="Avg resolution"
          value={`${(statsQuery.data?.avgResolutionDays ?? 0).toFixed(1)}d`}
          description="Average time from approval to resolved."
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Resolution queue</CardTitle>
              <CardDescription>
                Open disputes with client, project, and ownership context. Use the filters to narrow to the cases needing attention first.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={() => void disputesQuery.refetch()}>
              <RefreshCcwIcon data-icon="inline-start" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ticket, client, project, or title"
              aria-label="Search disputes"
              className="sm:w-80"
            />

            <ToggleGroup
              value={[queue]}
              onValueChange={(value) => {
                const nextValue = value[0];
                if (nextValue === "all" || nextValue === "pending-approval" || nextValue === "escalated" || nextValue === "active" || nextValue === "resolved") {
                  setQueue(nextValue);
                }
              }}
              variant="outline"
              size="sm"
              spacing={0}
            >
              {quickQueueLabels.map((item) => (
                <ToggleGroupItem key={item.value} value={item.value}>
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <Select<string>
              value={status}
              onValueChange={(value) => {
                if (!value) return;
                if (value === "all-statuses" || Object.values(DisputeStatus).includes(value as DisputeStatus)) {
                  setStatus(value as DisputeStatus | "all-statuses");
                }
              }}
            >
              <SelectTrigger size="sm" aria-label="Filter disputes by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all-statuses">All statuses</SelectItem>
                  {Object.values(DisputeStatus).map((value) => (
                    <SelectItem key={value} value={value}>
                      {formatDisputeStatus(value)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select<string>
              value={category}
              onValueChange={(value) => {
                if (!value) return;
                if (value === "all-categories" || Object.values(DisputeCategory).includes(value as DisputeCategory)) {
                  setCategory(value as DisputeCategory | "all-categories");
                }
              }}
            >
              <SelectTrigger size="sm" aria-label="Filter disputes by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all-categories">All categories</SelectItem>
                  {Object.values(DisputeCategory).map((value) => (
                    <SelectItem key={value} value={value}>
                      {formatDisputeCategory(value)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select<string>
              value={priority}
              onValueChange={(value) => {
                if (!value) return;
                if (value === "all-priorities" || Object.values(DisputePriority).includes(value as DisputePriority)) {
                  setPriority(value as DisputePriority | "all-priorities");
                }
              }}
            >
              <SelectTrigger size="sm" aria-label="Filter disputes by priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all-priorities">All priorities</SelectItem>
                  {Object.values(DisputePriority).map((value) => (
                    <SelectItem key={value} value={value}>
                      {formatDisputePriority(value)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select<string>
              value={stale}
              onValueChange={(value) => {
                if (!value) return;
                if (value === "all-activity" || value === "stale-3-days" || value === "stale-7-days") {
                  setStale(value);
                }
              }}
            >
              <SelectTrigger size="sm" aria-label="Filter disputes by staleness">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all-activity">All activity</SelectItem>
                  <SelectItem value="stale-3-days">Stale 3d+</SelectItem>
                  <SelectItem value="stale-7-days">Stale 7d+</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle="Loading PM disputes"
              loadingDescription="Retrieving the current dispute queue for this PM."
            />
          ) : isError ? (
            <WorkspaceQueryState
              kind="error"
              error={disputesQuery.error}
              onRetry={() => void disputesQuery.refetch()}
            />
          ) : rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldAlertIcon />
                </EmptyMedia>
                <EmptyTitle>No disputes match these filters</EmptyTitle>
                <EmptyDescription>
                  Try another status, priority, queue, or staleness filter to inspect a different segment of your assigned disputes.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DisputesTable rows={rows} detailHrefBase="/pm/disputes" showPm={false} />
          )}
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
