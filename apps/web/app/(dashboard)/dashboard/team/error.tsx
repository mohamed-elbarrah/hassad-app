"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function TeamError({
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
      backHref="/dashboard/team"
      backLabel="العودة للوحة الفريق"
    />
  );
}
