"use client";

import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";

export default function Error({
  error: _error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminPageError
      title="حدث خطأ في تحميل التقارير"
      description="تعذر تحميل بيانات التقارير. يرجى تحديث الصفحة والمحاولة مرة أخرى."
    />
  );
}
