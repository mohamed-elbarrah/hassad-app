"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileTextIcon } from "lucide-react";

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  formatProposalCurrency,
  formatProposalStatus,
  getFilteredProposals,
  type ProposalDateFilter,
  type ProposalDirectoryFilter,
  type ProposalValueFilter,
} from "@/features/crm-proposals/lib/proposal-directory";

export function ProposalsWorkspace() {
  const [statusFilter, setStatusFilter] = useState<ProposalDirectoryFilter>("all");
  const [dateFilter, setDateFilter] = useState<ProposalDateFilter>("last-30-days");
  const [valueFilter, setValueFilter] = useState<ProposalValueFilter>("all-values");

  const rows = useMemo(
    () => getFilteredProposals(statusFilter, dateFilter, valueFilter),
    [statusFilter, dateFilter, valueFilter]
  );

  return (
    <PageScaffold
      title="Proposals"
      description="CRM proposal view for commercial documents, client decision state, and contract readiness."
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
                setStatusFilter(nextValue);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="sent">Sent</ToggleGroupItem>
            <ToggleGroupItem value="approved">Approved</ToggleGroupItem>
            <ToggleGroupItem value="revision-requested">Revision requested</ToggleGroupItem>
            <ToggleGroupItem value="rejected">Rejected</ToggleGroupItem>
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
            <SelectTrigger size="sm" aria-label="Filter proposals by date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-time">All dates</SelectItem>
                <SelectItem value="last-7-days">Sent in last 7 days</SelectItem>
                <SelectItem value="last-30-days">Sent in last 30 days</SelectItem>
                <SelectItem value="last-90-days">Sent in last 90 days</SelectItem>
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
            <SelectTrigger size="sm" aria-label="Filter proposals by value">
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
          <CardTitle>Proposal register</CardTitle>
          <CardDescription>
            Each row shows who prepared the proposal, its value, decision state, validity window, and whether it is ready to move into contract work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileTextIcon />
                </EmptyMedia>
                <EmptyTitle>No proposals match these filters</EmptyTitle>
                <EmptyDescription>
                  Change the status, date, or value filters to inspect another proposal segment.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Client / request</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Contract</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/admin/proposals/${row.id}`}
                        className="font-medium hover:underline"
                      >
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
                    <TableCell>{row.creator}</TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span>{row.servicesCount} services</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {row.servicesLabel}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatProposalCurrency(row.totalValue)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.statusTone}>
                        {formatProposalStatus(row.status)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{row.sentAtLabel}</TableCell>
                    <TableCell>{row.responseLabel}</TableCell>
                    <TableCell>
                      <StatusBadge tone={row.validityTone}>
                        {row.validUntilLabel}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.contractTone}>
                        {row.contractLabel}
                      </StatusBadge>
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
