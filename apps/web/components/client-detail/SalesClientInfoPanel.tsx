"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/design-system/EmptyState";
import { ClientInfoCards } from "@/components/client-detail/ClientInfoCards";
import { useGetSalesClientInfoQuery } from "@/features/clients/clientsApi";
import { clientWorkflowErrorMessage } from "@/lib/i18n";
import { mapSalesClientInfo } from "@/lib/mapSalesClientInfo";

export function SalesClientInfoPanel({
  clientId,
  active,
}: {
  clientId?: string;
  active: boolean;
}) {
  const query = useGetSalesClientInfoQuery(clientId ?? "", {
    skip: !active || !clientId,
  });

  if (!clientId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          لا يوجد عميل مرتبط بهذا السجل.
        </CardContent>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card>
        <CardContent
          className="p-6 text-sm text-muted-foreground"
          aria-live="polite"
        >
          جارٍ تحميل بيانات العميل…
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="تعذّر تحميل بيانات العميل"
        message={clientWorkflowErrorMessage(query.error)}
        onRetry={query.refetch}
      />
    );
  }

  const client = query.currentData;
  if (!active || !client || client.id !== clientId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground" aria-live="polite">
          جارٍ تحميل بيانات العميل…
        </CardContent>
      </Card>
    );
  }

  return <ClientInfoCards client={mapSalesClientInfo(client)} />;
}
