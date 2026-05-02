"use client";

import { ErrorFallback } from "@/components/common/ErrorFallback";

export default function EmployeeError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} backHref="/dashboard/employee" backLabel="العودة للوحة الموظف" />;
}
