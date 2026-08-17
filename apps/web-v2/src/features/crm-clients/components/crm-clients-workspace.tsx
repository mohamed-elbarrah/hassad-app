"use client";

import { useState } from "react";

import { ClientPortfolioWorkspace } from "@/features/clients/components/client-portfolio-workspace";
import type { ClientDirectoryFilter, ClientDirectorySort } from "@/features/clients/lib/client-directory";
import { useGetCrmClientsWorkspaceQuery } from "@/lib/api/crm-clients-api";

export function CrmClientsWorkspace() {
  const [filter, setFilter] = useState<ClientDirectoryFilter>("all");
  const [sort, setSort] = useState<ClientDirectorySort>("highest-spend");

  const { data, error, isError, isLoading, refetch } = useGetCrmClientsWorkspaceQuery({
    filter,
    sort,
  });

  return (
    <ClientPortfolioWorkspace
      title="Clients"
      description="CRM workspace view for active accounts and pipeline-only leads."
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
      basePath="/crm/clients"
      showOwner={false}
    />
  );
}
