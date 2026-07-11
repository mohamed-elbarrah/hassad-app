"use client";

import { PmDetailError } from "@/components/dashboard/pm/shared/PmDetailError";

export default function DisputeDetailError() {
  return (
    <PmDetailError
      title="حدث خطأ أثناء تحميل بيانات النزاع."
      backHref="/dashboard/pm/disputes"
      backLabel="النزاعات"
    />
  );
}
