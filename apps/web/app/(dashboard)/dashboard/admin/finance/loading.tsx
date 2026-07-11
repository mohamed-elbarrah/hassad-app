export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-neutral-100"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-80 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    </div>
  );
}
