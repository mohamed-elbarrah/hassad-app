"use client";

import { SalesPageError } from "@/components/dashboard/sales/shared/SalesPageError";

export default function ContractDetailError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <SalesPageError
      error={error}
      reset={reset}
      backHref="/dashboard/sales/contracts"
      backLabel="العقود"
    />
  );
}
