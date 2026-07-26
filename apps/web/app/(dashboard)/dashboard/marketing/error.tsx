"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function MarketingError({
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
      backHref="/dashboard/marketing"
      backLabel="العودة للوحة التسويق"
    />
  );
}
