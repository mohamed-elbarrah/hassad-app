"use client";

import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";

export default function Error() {
  return (
    <AdminDetailError
      title="حدث خطأ أثناء تحميل بيانات المهمة"
      backHref="/dashboard/admin/tasks"
      backLabel="المهام"
    />
  );
}
