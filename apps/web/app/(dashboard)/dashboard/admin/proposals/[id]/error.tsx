"use client";

import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";

export default function Error() {
  return (
    <AdminDetailError
      title="حدث خطأ أثناء تحميل بيانات عرض السعر"
      backHref="/dashboard/admin/proposals"
      backLabel="عروض الأسعار"
    />
  );
}
