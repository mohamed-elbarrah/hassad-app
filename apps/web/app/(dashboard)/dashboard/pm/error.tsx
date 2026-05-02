"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function PmError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} backHref="/dashboard/pm" backLabel="العودة للوحة المشاريع" />;
}
