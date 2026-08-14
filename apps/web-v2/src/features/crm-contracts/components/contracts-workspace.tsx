"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileSignatureIcon } from "lucide-react";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
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
  formatContractCurrency,
  formatContractStatus,
  type ContractDirectoryRecord,
  type ContractDateFilter,
  type ContractDirectoryFilter,
  type ContractValueFilter,
} from "@/features/crm-contracts/lib/contract-directory";
import { mapContractIndexItem } from "@/features/admin-details/lib/admin-index-mappers";
import { useGetAdminContractsQuery } from "@/lib/api/admin-contracts-api";
import { useAppSelector } from "@/lib/store";

export function ContractsWorkspace() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const [statusFilter, setStatusFilter] = useState<ContractDirectoryFilter>("all");
  const [dateFilter, setDateFilter] = useState<ContractDateFilter>("ending-60-days");
  const [valueFilter, setValueFilter] = useState<ContractValueFilter>("all-values");

  const { data, error, isError, isLoading, refetch } = useGetAdminContractsQuery(
    {
      status:
        statusFilter === "all"
          ? undefined
          : statusFilter === "signed"
            ? "SIGNED"
            : statusFilter === "on-hold"
              ? "ON_HOLD"
              : statusFilter.toUpperCase(),
      expiringDays:
        dateFilter === "ending-30-days"
          ? 30
          : dateFilter === "ending-60-days"
            ? 60
            : dateFilter === "ending-90-days"
              ? 90
              : undefined,
      limit: 100,
    },
    { skip: authStatus !== "authenticated" },
  );

  const rows = useMemo<ContractDirectoryRecord[]>(() => {
    const items = (data?.items ?? []).map(mapContractIndexItem);
    return items.filter((row: ContractDirectoryRecord) => {
      if (valueFilter === "under-15000") return row.totalValue < 15000;
      if (valueFilter === "15000-30000") {
        return row.totalValue >= 15000 && row.totalValue < 30000;
      }
      if (valueFilter === "30000-50000") {
        return row.totalValue >= 30000 && row.totalValue < 50000;
      }
      if (valueFilter === "50000-plus") return row.totalValue >= 50000;
      return true;
    });
  }, [data?.items, valueFilter]);

  return (
    <PageScaffold
      title="Contracts"
      description="CRM contract register for signing state, activation progress, renewal timing, and delivery handoff."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(value) => {
              const nextValue = value[0];
              if (
                nextValue === "all" ||
                nextValue === "sent" ||
                nextValue === "signed" ||
                nextValue === "active" ||
                nextValue === "on-hold" ||
                nextValue === "expired" ||
                nextValue === "cancelled"
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
            <ToggleGroupItem value="signed">Signed</ToggleGroupItem>
            <ToggleGroupItem value="active">Active</ToggleGroupItem>
            <ToggleGroupItem value="on-hold">On hold</ToggleGroupItem>
            <ToggleGroupItem value="expired">Expired</ToggleGroupItem>
            <ToggleGroupItem value="cancelled">Cancelled</ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={dateFilter}
            onValueChange={(value) => {
              if (
                value === "all-dates" ||
                value === "ending-30-days" ||
                value === "ending-60-days" ||
                value === "ending-90-days"
              ) {
                setDateFilter(value);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter contracts by end date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-dates">All dates</SelectItem>
                <SelectItem value="ending-30-days">Ending in 30 days</SelectItem>
                <SelectItem value="ending-60-days">Ending in 60 days</SelectItem>
                <SelectItem value="ending-90-days">Ending in 90 days</SelectItem>
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
            <SelectTrigger size="sm" aria-label="Filter contracts by value">
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
          <CardTitle>Contract register</CardTitle>
          <CardDescription>
            Each row shows contract value, signing and activation state, renewal timing, invoice signal, and whether delivery has already been linked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authStatus !== "authenticated" || (isLoading && !data) ? (
            <WorkspaceQueryState
              kind="loading"
              loadingTitle="Loading contracts"
              loadingDescription="Retrieving the contract register from the admin API."
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
                  <FileSignatureIcon />
                </EmptyMedia>
                <EmptyTitle>No contracts match these filters</EmptyTitle>
                <EmptyDescription>
                  Change the status, date, or value filters to inspect another contract segment.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total value</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Invoices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/admin/contracts/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell>{row.clientName}</TableCell>
                    <TableCell>{row.typeLabel}</TableCell>
                    <TableCell>
                      <StatusBadge tone={row.statusTone}>
                        {formatContractStatus(row.status)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatContractCurrency(row.totalValue)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.monthlyValue ? formatContractCurrency(row.monthlyValue) : "—"}
                    </TableCell>
                    <TableCell>{row.signedLabel}</TableCell>
                    <TableCell>{row.endLabel}</TableCell>
                    <TableCell>
                      <StatusBadge tone={row.renewalTone}>{row.renewalLabel}</StatusBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.projectTone}>{row.projectLabel}</StatusBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={row.invoiceTone}>{row.invoiceLabel}</StatusBadge>
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
