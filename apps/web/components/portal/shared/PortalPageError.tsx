"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export function PortalPageError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      backHref="/portal"
      backLabel="العودة للبوابة"
    />
  );
}
