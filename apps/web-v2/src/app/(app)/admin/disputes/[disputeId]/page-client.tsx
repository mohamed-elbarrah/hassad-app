"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapDisputeDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { DisputeDetailWorkspace } from "@/features/disputes/components/dispute-detail-workspace";
import { useGetDisputeDetailQuery } from "@/lib/api/admin-details-api";
import { useTranslations } from "@/lib/i18n";

export function DisputeDetailPageClient({
  disputeId,
}: {
  disputeId: string;
}) {
  const { t } = useTranslations();
  const { data, error, isError, isLoading, refetch } =
    useGetDisputeDetailQuery(disputeId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title={t("disputeDetail")}
        description={t("disputeDetailLoadingDescription")}
      >
        <WorkspaceQueryState kind="loading" loadingTitle={t("disputeDetailLoading")} />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title={t("disputeDetail")}
        description={t("projectDetailErrorDescription")}
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <DisputeDetailWorkspace dispute={mapDisputeDetailFromApi(data)} />;
}
