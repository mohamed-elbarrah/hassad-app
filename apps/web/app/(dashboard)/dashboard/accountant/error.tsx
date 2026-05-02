"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function AccountantError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} backHref="/dashboard/accountant" backLabel="العودة للوحة المحاسب" />;
}
