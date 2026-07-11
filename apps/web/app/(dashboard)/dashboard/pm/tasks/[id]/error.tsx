"use client";

import { PmDetailError } from "@/components/dashboard/pm/shared/PmDetailError";

export default function TaskDetailError() {
  return (
    <PmDetailError
      title="حدث خطأ أثناء تحميل بيانات المهمة."
      backHref="/dashboard/pm/tasks"
      backLabel="المهام"
    />
  );
}
