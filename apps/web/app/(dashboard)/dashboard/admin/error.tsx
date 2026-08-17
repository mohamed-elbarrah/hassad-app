"use client";

import { OverviewError } from "./_components/overview-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <OverviewError error={error} reset={reset} />;
}
