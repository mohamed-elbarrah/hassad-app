"use client";

import { FinancePageError } from "@/components/dashboard/finance/shared/FinancePageError";

export default function RouteError({
  error,
  reset: _reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <FinancePageError
      error={error}
      reset={_reset}
      message="حدث خطأ غير متوقع"
      hint="يرجى المحاولة مرة أخرى."
    />
  );
}
