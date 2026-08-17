"use client";

import { useMemo, useState } from "react";

import { mapProposalIndexItem } from "@/features/admin-details/lib/admin-index-mappers";
import { ProposalRegisterWorkspace } from "@/features/crm-proposals/components/proposal-register-workspace";
import type {
  ProposalDateFilter,
  ProposalDirectoryFilter,
  ProposalValueFilter,
  ProposalDirectoryRecord,
} from "@/features/crm-proposals/lib/proposal-directory";
import { useGetAdminProposalsQuery } from "@/lib/api/admin-proposals-api";
import { useAppSelector } from "@/lib/store";

export function ProposalsWorkspace() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const [statusFilter, setStatusFilter] = useState<ProposalDirectoryFilter>("all");
  const [dateFilter, setDateFilter] = useState<ProposalDateFilter>("last-30-days");
  const [valueFilter, setValueFilter] = useState<ProposalValueFilter>("all-values");

  const { data, error, isError, isLoading, refetch } = useGetAdminProposalsQuery(
    {
      status:
        statusFilter === "all"
          ? undefined
          : statusFilter === "revision-requested"
            ? "REVISION_REQUESTED"
            : statusFilter.toUpperCase(),
      limit: 100,
    },
    { skip: authStatus !== "authenticated" },
  );

  const rows = useMemo<ProposalDirectoryRecord[]>(() => {
    const items = (data?.items ?? []).map(mapProposalIndexItem);

    return items
      .filter((row: ProposalDirectoryRecord) => {
        if (dateFilter === "last-7-days") return row.sentDaysAgo <= 7;
        if (dateFilter === "last-30-days") return row.sentDaysAgo <= 30;
        if (dateFilter === "last-90-days") return row.sentDaysAgo <= 90;
        return true;
      })
      .filter((row: ProposalDirectoryRecord) => {
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
  }, [data?.items, dateFilter, valueFilter]);

  return (
    <ProposalRegisterWorkspace
      title="Proposals"
      description="CRM proposal view for commercial documents, client decision state, and contract readiness."
      rows={rows}
      isLoading={authStatus !== "authenticated" || isLoading}
      isError={isError}
      error={error}
      onRetry={() => {
        void refetch();
      }}
      statusFilter={statusFilter}
      dateFilter={dateFilter}
      valueFilter={valueFilter}
      onStatusFilterChange={setStatusFilter}
      onDateFilterChange={setDateFilter}
      onValueFilterChange={setValueFilter}
      basePath="/admin/proposals"
      showCreator
    />
  );
}
