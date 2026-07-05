export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-28 animate-pulse rounded-lg bg-neutral-100"
          />
        ))}
      </div>
      <div className="h-64 w-full animate-pulse rounded-2xl bg-neutral-100" />
    </div>
  );
}
