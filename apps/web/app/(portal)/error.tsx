"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function PortalError({
  error,
  reset: _reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={_reset}
      backHref="/portal"
      backLabel="العودة للبوابة"
    />
  );
}
