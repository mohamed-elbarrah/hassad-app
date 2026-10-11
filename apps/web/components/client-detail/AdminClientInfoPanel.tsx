"use client";

import { ClientInfoPanel } from "@/components/client-detail/ClientInfoPanel";
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
  return (
    <ClientInfoPanel
      clientId={clientId}
      client={client ? mapAdminClientDetail(client) : undefined}
      isLoading={isLoading}
      error={error}
      errorMessage={adminErrorMessage}
      onRetry={onRetry}
    />
  );
}
