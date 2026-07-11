export default function AdminUserDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-neutral-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-100" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      </div>
      <div className="h-96 w-full animate-pulse rounded-2xl bg-neutral-100" />
    </div>
  );
}
