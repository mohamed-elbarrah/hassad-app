"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/design-system/EmptyState";
import { ClientInfoCards } from "@/components/client-detail/ClientInfoCards";
import type { AdminClientFullDetail } from "@/features/admin/adminClientsApi";
import { adminErrorMessage } from "@/lib/i18n";
import { mapAdminClientDetail } from "@/lib/mapAdminClientDetail";

export function AdminClientInfoPanel({
  clientId,
  client,
  isLoading,
  error,
  onRetry,
}: {
  clientId?: string;
  client?: AdminClientFullDetail;
  isLoading: boolean;
  error?: unknown;
  onRetry: () => void;
}) {
  if (!clientId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          لا يوجد عميل مرتبط بهذا السجل.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
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

  if (error) {
    return (
      <ErrorState
        title="تعذّر تحميل بيانات العميل"
        message={adminErrorMessage(error)}
        onRetry={onRetry}
      />
    );
  }

  if (!client || client.id !== clientId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          لا تتوفر بيانات لهذا العميل.
        </CardContent>
      </Card>
    );
  }

  return <ClientInfoCards client={mapAdminClientDetail(client)} />;
}
