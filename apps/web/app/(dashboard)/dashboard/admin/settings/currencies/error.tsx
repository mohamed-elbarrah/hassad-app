"use client";

import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <AdminPageError
      title="حدث خطأ"
      description="تعذر تحميل العملات. يرجى تحديث الصفحة والمحاولة مرة أخرى."
      onRetry={reset}
    />
  );
}
