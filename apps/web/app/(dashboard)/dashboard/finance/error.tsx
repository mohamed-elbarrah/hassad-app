"use client";

import { FinancePageError } from "@/components/dashboard/finance/shared/FinancePageError";

export default function FinanceError({
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
      message="حدث خطأ في لوحة التحكم المالية"
      hint="يرجى المحاولة مرة أخرى أو العودة لاحقاً."
    />
  );
}
