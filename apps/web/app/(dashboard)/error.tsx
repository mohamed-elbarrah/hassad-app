"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} backHref="/dashboard" backLabel="العودة للوحة الرئيسية" />;
}
