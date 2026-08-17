"use client";

import { useState } from "react";

import { ClientPortfolioWorkspace } from "@/features/clients/components/client-portfolio-workspace";
import type { ClientDirectoryFilter, ClientDirectorySort } from "@/features/clients/lib/client-directory";
import { useGetClientsWorkspaceQuery } from "@/lib/api/admin-clients-api";

export function ClientsWorkspace() {
  const [filter, setFilter] = useState<ClientDirectoryFilter>("all");
  const [sort, setSort] = useState<ClientDirectorySort>("highest-spend");

  const { data, error, isError, isLoading, refetch } = useGetClientsWorkspaceQuery({
    filter,
    sort,
  });

  return (
    <ClientPortfolioWorkspace
      title="Clients"
      description="Account portfolio view for active revenue, pipeline-only leads, and outstanding CRM or finance follow-up."
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
      basePath="/admin/clients"
      showOwner
    />
  );
}
