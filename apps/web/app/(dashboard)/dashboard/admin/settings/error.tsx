"use client";

import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminPageError
      title="حدث خطأ في تحميل الإعدادات"
      description={error.message || "تعذر تحميل البيانات. يرجى تحديث الصفحة والمحاولة مرة أخرى."}
    />
  );
}
