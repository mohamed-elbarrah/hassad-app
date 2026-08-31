"use client";

import { ErrorState } from "@/components/design-system/EmptyState";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="لوحة الإدارة غير متاحة" onRetry={reset} />;
}
