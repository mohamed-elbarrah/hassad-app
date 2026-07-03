"use client";

import { AlertCircle } from "lucide-react";

interface PmPageErrorProps {
  title?: string;
  description?: string;
}

export function PmPageError({
  title = "حدث خطأ",
  description = "تعذر تحميل البيانات. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
}: PmPageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-portal-card-border bg-portal-bg p-12 text-center" dir="rtl">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-100">
        <AlertCircle className="h-7 w-7 text-danger-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-natural-100">{title}</h2>
        <p className="text-sm text-portal-note-text mt-1">{description}</p>
      </div>
    </div>
  );
}
