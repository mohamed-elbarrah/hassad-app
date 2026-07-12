"use client";

export default function Error() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-portal-card-border bg-portal-bg p-12 text-center" dir="rtl">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-100">
        <svg className="h-7 w-7 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-natural-100">حدث خطأ أثناء تحميل العملاء المتوقعين</h2>
      <p className="text-sm text-portal-note-text mt-1">يرجى المحاولة مرة أخرى.</p>
    </div>
  );
}
