"use client";

import { Megaphone, RotateCcw } from "lucide-react";

export default function AdminMarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12" dir="rtl">
      <div className="p-4 rounded-full bg-danger-50">
        <Megaphone className="size-8 text-danger-500" />
      </div>
      <h2 className="text-lg font-semibold text-natural-100">حدث خطأ</h2>
      <p className="text-sm text-portal-note-text text-center max-w-md">
        تعذر تحميل صفحة الاستراتيجيات التسويقية. يرجى المحاولة مرة أخرى.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-500 text-white text-sm font-medium hover:bg-secondary-600 transition-colors"
      >
        <RotateCcw className="size-4" />
        إعادة المحاولة
      </button>
    </div>
  );
}
