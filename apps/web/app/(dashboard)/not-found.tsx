import Link from "next/link";
import { ArrowRight, FileQuestion } from "lucide-react";

/**
 * Dashboard-scoped 404 page.
 *
 * Lives inside the `(dashboard)` route group, so it inherits the
 * dashboard layout (RTL, sidebar, header). Server component — no
 * client-side dependencies needed for a static 404 page.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>

      <div className="max-w-md text-center space-y-2">
        <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
        <p className="text-sm text-muted-foreground">
          الرابط الذي تبحث عنه غير متوفر أو تم نقله.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للوحة الرئيسية
      </Link>
    </div>
  );
}