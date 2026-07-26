"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function SalesError({
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
      backHref="/dashboard/sales"
      backLabel="العودة لصفحة المبيعات"
    />
  );
}
