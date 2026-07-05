export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
      <div className="h-10 w-full animate-pulse rounded-2xl bg-neutral-100" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-[30px] bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
