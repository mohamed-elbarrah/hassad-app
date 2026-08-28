"use client";

import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminPageError
      title="حدث خطأ في تحميل العقود"
      description="تعذر تحميل البيانات. يرجى المحاولة مرة أخرى."
      onRetry={reset}
    />
  );
}
