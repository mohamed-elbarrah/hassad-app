"use client";

import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusinessIcon } from "lucide-react";
import { ClientSource } from "@hassad/shared";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
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
  formatOrderCurrency,
  formatOrderSource,
  formatOrderStage,
  formatProposalStatus,
  type OrderDateFilter,
  type OrderDirectoryFilter,
  type OrderValueFilter,
} from "@/features/crm-orders/lib/order-directory";
import { useGetCrmWorkspaceQuery } from "@/lib/api/admin-workspaces-api";

export function OrdersWorkspace() {
  const [statusFilter, setStatusFilter] = useState<OrderDirectoryFilter>("all");
  const [dateFilter, setDateFilter] = useState<OrderDateFilter>("last-30-days");
  const [valueFilter, setValueFilter] = useState<OrderValueFilter>("all-values");

  const { data } = useGetCrmWorkspaceQuery({
    statusFilter,
    dateFilter,
    valueFilter,
  });
  const rows = data?.items ?? [];

  return (
    <PageScaffold
      title="Orders"
      description="CRM pipeline view for active orders before signed contracts are converted into project delivery."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(value) => {
              const nextValue = value[0];

              if (
                nextValue === "all" ||
                nextValue === "active" ||
                nextValue === "waiting-approval" ||
                nextValue === "stalled"
              ) {
                setStatusFilter(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="active">Active</ToggleGroupItem>
            <ToggleGroupItem value="waiting-approval">Waiting approval</ToggleGroupItem>
            <ToggleGroupItem value="stalled">Stalled</ToggleGroupItem>
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
                setDateFilter(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter orders by date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-time">All dates</SelectItem>
                <SelectItem value="last-7-days">Opened in last 7 days</SelectItem>
                <SelectItem value="last-30-days">Opened in last 30 days</SelectItem>
                <SelectItem value="last-90-days">Opened in last 90 days</SelectItem>
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
                setValueFilter(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter orders by value">
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
          <CardTitle>Pipeline orders</CardTitle>
          <CardDescription>
            Each row shows the CRM state, value, follow-up discipline, and proposal or contract signal that matters before project handoff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BriefcaseBusinessIcon />
                </EmptyMedia>
                <EmptyTitle>No orders match these filters</EmptyTitle>
                <EmptyDescription>
                  Change the status, date, or value filters to inspect another pipeline segment.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Estimated value</TableHead>
                  <TableHead>Last contact</TableHead>
                  <TableHead>Next follow-up</TableHead>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Aging</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/admin/crm/orders/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.companyName}
                        </Link>
                        <span className="truncate text-sm text-muted-foreground">
                          {row.contactName} · {row.serviceLine}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.stageTone}>
                        {formatOrderStage(row.stage)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{row.owner}</TableCell>
                    <TableCell>{formatOrderSource(row.source as ClientSource)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatOrderCurrency(row.estimatedValue)}
                    </TableCell>
                    <TableCell>{row.lastContact}</TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span>{row.nextFollowUp}</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {row.nextStep}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.proposalTone}>
                        {formatProposalStatus(row.proposalStatus)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <StatusBadge tone={row.contractTone}>
                          {row.contractState}
                        </StatusBadge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.agingTone}>{row.agingLabel}</StatusBadge>
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
