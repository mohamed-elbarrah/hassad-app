export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
      <div className="h-4 w-72 animate-pulse rounded-lg bg-neutral-100" />
      <div className="h-12 w-full animate-pulse rounded-2xl bg-neutral-100" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded-2xl bg-neutral-100"
          />
        ))}
      </div>
    </div>
  );
}
