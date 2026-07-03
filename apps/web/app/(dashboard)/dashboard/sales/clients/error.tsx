"use client";

import { SalesPageError } from "@/components/dashboard/sales/shared/SalesPageError";

export default function ClientsError({ error, reset }: { error: Error; reset: () => void }) {
  return <SalesPageError error={error} reset={reset} backHref="/dashboard/sales/clients" backLabel="العملاء" />;
}
