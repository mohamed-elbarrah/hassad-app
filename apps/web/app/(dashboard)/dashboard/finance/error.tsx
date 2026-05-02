"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function FinanceError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} backHref="/dashboard/finance" backLabel="العودة للوحة المالية" />;
}
