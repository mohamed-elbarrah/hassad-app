"use client";

import { PmDetailError } from "@/components/dashboard/pm/shared/PmDetailError";

export default function ProjectDetailError() {
  return (
    <PmDetailError
      title="حدث خطأ أثناء تحميل بيانات المشروع."
      backHref="/dashboard/pm/projects"
      backLabel="المشاريع"
    />
  );
}
