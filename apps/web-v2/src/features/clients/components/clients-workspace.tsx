"use client";

import { useState } from "react";

import { ClientPortfolioWorkspace } from "@/features/clients/components/client-portfolio-workspace";
import type { ClientDirectoryFilter, ClientDirectorySort } from "@/features/clients/lib/client-directory";
import { useGetClientsWorkspaceQuery } from "@/lib/api/admin-clients-api";
import { useTranslations } from "@/lib/i18n";

export function ClientsWorkspace() {
  const { t } = useTranslations();
  const [filter, setFilter] = useState<ClientDirectoryFilter>("all");
  const [sort, setSort] = useState<ClientDirectorySort>("highest-spend");

  const { data, error, isError, isLoading, refetch } = useGetClientsWorkspaceQuery({
    // The API still calls the lead segment "requests"; the UI exposes the business term.
    filter: filter === "leads" ? "requests" : filter,
    sort,
  });

  return (
    <ClientPortfolioWorkspace
      title={t("clients")}
      description={t("clientPortfolioDescription")}
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
