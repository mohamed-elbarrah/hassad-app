"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} backHref="/dashboard/admin" backLabel="العودة للوحة الإدارة" />;
}
