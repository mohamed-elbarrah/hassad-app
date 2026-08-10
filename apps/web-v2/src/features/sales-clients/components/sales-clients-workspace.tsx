"use client";

import { useState } from "react";

import { ClientPortfolioWorkspace } from "@/features/clients/components/client-portfolio-workspace";
import type { ClientDirectoryFilter, ClientDirectorySort } from "@/features/clients/lib/client-directory";
import { useGetSalesClientsWorkspaceQuery } from "@/lib/api/sales-workspaces-api";

export function SalesClientsWorkspace() {
  const [filter, setFilter] = useState<ClientDirectoryFilter>("all");
  const [sort, setSort] = useState<ClientDirectorySort>("highest-spend");

  const { data, error, isError, isLoading, refetch } = useGetSalesClientsWorkspaceQuery({
    filter,
    sort,
  });

  return (
    <ClientPortfolioWorkspace
      title="Clients"
      description="Sales workspace view for active accounts and pipeline-only leads."
      rows={data?.items ?? []}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => {
        void refetch();
      }}
      filter={filter}
      sort={sort}
      onFilterChange={setFilter}
      onSortChange={setSort}
      basePath="/sales/clients"
      showOwner={false}
    />
  );
}
