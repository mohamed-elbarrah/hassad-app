"use client";

import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";

export default function Error() {
  return (
    <AdminPageError
      title="حدث خطأ"
      description="تعذر تحميل بيانات العملة. يرجى تحديث الصفحة والمحاولة مرة أخرى."
    />
  );
}
