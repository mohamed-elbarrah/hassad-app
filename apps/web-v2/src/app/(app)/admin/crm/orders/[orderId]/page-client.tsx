"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapOrderDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { OrderDetailWorkspace } from "@/features/crm-orders/components/order-detail-workspace";
import { useGetOrderDetailQuery } from "@/lib/api/admin-details-api";

export function OrderDetailPageClient({ orderId }: { orderId: string }) {
  const { data, error, isError, isLoading, refetch } =
    useGetOrderDetailQuery(orderId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="Order detail"
        description="Loading CRM order, contact history, and proposal linkage."
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading order detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="Order detail"
        description="This workspace now reads directly from the backend."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <OrderDetailWorkspace order={mapOrderDetailFromApi(data)} />;
}
