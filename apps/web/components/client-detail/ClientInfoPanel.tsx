"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/design-system/EmptyState";
import { ClientInfoCards } from "@/components/client-detail/ClientInfoCards";
import type {
  ClientDetailEntity,
  ClientDetailMode,
} from "@/components/client-detail/ClientDetailPattern";

export function ClientInfoPanel({
  clientId,
  client,
  mode = "admin",
  isLoading,
  error,
  errorMessage,
  onRetry,
}: {
  clientId?: string;
  client?: ClientDetailEntity;
  mode?: ClientDetailMode;
  isLoading: boolean;
  error?: unknown;
  errorMessage: (error: unknown) => string;
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
        message={errorMessage(error)}
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

  return <ClientInfoCards client={client} mode={mode} />;
}
