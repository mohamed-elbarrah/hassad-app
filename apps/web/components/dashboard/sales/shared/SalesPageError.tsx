"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

interface SalesPageErrorProps {
  error: Error;
  reset: () => void;
  backHref?: string;
  backLabel?: string;
}

/**
 * Route‑level error boundary for sales pages.
 * Mirrors the portal `PortalPageError` pattern.
 */
export function SalesPageError({
  error,
  reset,
  backHref = "/dashboard/sales",
  backLabel = "العودة لصفحة المبيعات",
}: SalesPageErrorProps) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
