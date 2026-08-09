"use client";

import { useMemo, useState } from "react";
import { ShieldAlertIcon } from "lucide-react";
import {
  DisputeCategory,
  DisputePriority,
  DisputeStatus,
} from "@hassad/shared";

import { PageScaffold } from "@/components/patterns/page-scaffold";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { DisputesTable } from "@/features/disputes/components/disputes-table";
import {
  formatDisputeCategory,
  formatDisputePriority,
  formatDisputeStatus,
  getDisputePmOptions,
  getFilteredDisputes,
  type DisputeQueueFilter,
  type DisputeStaleFilter,
} from "@/features/disputes/lib/dispute-directory";

export function DisputesWorkspace() {
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<DisputeQueueFilter>("all");
  const [status, setStatus] = useState<DisputeStatus | "all-statuses">(
    "all-statuses"
  );
  const [category, setCategory] = useState<DisputeCategory | "all-categories">(
    "all-categories"
  );
  const [priority, setPriority] = useState<DisputePriority | "all-priorities">(
    "all-priorities"
  );
  const [pm, setPm] = useState<string | "all-pms">("all-pms");
  const [stale, setStale] = useState<DisputeStaleFilter>("all-activity");

  const rows = useMemo(
    () =>
      getFilteredDisputes({
        search,
        queue,
        status,
        category,
        priority,
        pm,
        stale,
      }),
    [category, pm, priority, queue, search, stale, status]
  );

  const pmOptions = useMemo(() => getDisputePmOptions(), []);

  return (
    <PageScaffold
      title="Disputes"
      description="Delivery-risk queue for complaint approval, escalation handling, PM ownership issues, and client-facing resolution follow-up."
      actions={
        <>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticket, client, project, PM, or category"
            aria-label="Search disputes"
            className="sm:w-80"
          />

          <ToggleGroup
            value={[queue]}
            onValueChange={(value) => {
              const nextValue = value[0];

              if (
                nextValue === "all" ||
                nextValue === "pending-approval" ||
                nextValue === "escalated" ||
                nextValue === "active" ||
                nextValue === "resolved"
              ) {
                setQueue(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="pending-approval">Pending approval</ToggleGroupItem>
            <ToggleGroupItem value="escalated">Escalated</ToggleGroupItem>
            <ToggleGroupItem value="active">Active</ToggleGroupItem>
            <ToggleGroupItem value="resolved">Resolved</ToggleGroupItem>
          </ToggleGroup>

          <Select<string>
            value={status}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (
                value === "all-statuses" ||
                Object.values(DisputeStatus).includes(value as DisputeStatus)
              ) {
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
              if (!value) {
                return;
              }

              if (
                value === "all-categories" ||
                Object.values(DisputeCategory).includes(value as DisputeCategory)
              ) {
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
              if (!value) {
                return;
              }

              if (
                value === "all-priorities" ||
                Object.values(DisputePriority).includes(value as DisputePriority)
              ) {
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
            value={pm}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (value === "all-pms" || pmOptions.includes(value)) {
                setPm(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter disputes by PM">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-pms">All PMs</SelectItem>
                {pmOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select<string>
            value={stale}
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (
                value === "all-activity" ||
                value === "stale-3-days" ||
                value === "stale-7-days"
              ) {
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
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Resolution queue</CardTitle>
          <CardDescription>
            Each row shows complaint ownership, current dispute state, and whether admin action is needed before the case ages further.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldAlertIcon />
                </EmptyMedia>
                <EmptyTitle>No disputes match these filters</EmptyTitle>
                <EmptyDescription>
                  Change the queue, status, PM, or stale-activity filters to inspect another dispute segment.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DisputesTable rows={rows} />
          )}
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
