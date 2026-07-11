import Link from "next/link";
import { ArrowRight, FileQuestion } from "lucide-react";

/**
 * Portal-scoped 404 page.
 *
 * Lives inside the `(portal)` route group, so it inherits the portal
 * layout (RTL, Arabic, sidebar, header). Kept as a server component
 * with zero client-side dependencies — the root `not-found.tsx` pattern
 * we tried earlier broke every route because it was a client component
 * rendered outside the layout tree.
 */
export default function PortalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-badge-gray-bg">
        <FileQuestion className="h-10 w-10 text-secondary-500" />
      </div>

      <div className="max-w-md text-center space-y-2">
        <h1 className="text-2xl font-bold text-natural-100">
          الصفحة غير موجودة
        </h1>
        <p className="text-sm leading-6 text-portal-note-text">
          الرابط الذي تبحث عنه غير متوفر أو تم نقله.
        </p>
      </div>

      <Link
        href="/portal"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-secondary-600"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للبوابة
      </Link>
    </div>
  );
}
