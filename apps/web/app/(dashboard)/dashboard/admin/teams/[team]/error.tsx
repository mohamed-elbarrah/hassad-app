"use client";

import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";

export default function Error() {
  return (
    <AdminDetailError
      title="حدث خطأ أثناء تحميل بيانات الفريق"
      backHref="/dashboard/admin/teams"
      backLabel="الفرق"
    />
  );
}
