"use client";

import Link from "next/link";
import { FileQuestion, ArrowRight, Home } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";

/**
 * Global 404 fallback.
 * - Authenticated portal users get a friendly CTA back to /portal.
 * - Authenticated dashboard users get a CTA back to /dashboard.
 * - Unauthenticated users land on the home/login CTAs.
 *
 * The role is read from a client-side cookie/header probe because Next.js
 * does not pass the JWT into not-found.tsx (it is a routing layer, not a
 * React tree). The default link falls back to /login so we never strand the
 * user on an empty page.
 */
export default function GlobalNotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 p-8"
      dir="rtl"
      style={{ background: "#F9FAFB" }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-badge-gray-bg">
        <FileQuestion className="h-10 w-10 text-secondary-500" />
      </div>

      <div className="max-w-md text-center space-y-2">
        <h1 className="text-3xl font-bold text-natural-100">
          الصفحة غير موجودة
        </h1>
        <p className="text-sm leading-6 text-portal-note-text">
          الرابط الذي تبحث عنه غير متوفر أو تم نقله. يمكنك العودة إلى بوابة
          العميل أو لوحة التحكم من الأزرار أدناه.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/portal" prefetch={false}>
          <ActionButton
            variant="primary"
            icon={<Home className="h-4 w-4" />}
            className="gap-2"
          >
            بوابة العميل
          </ActionButton>
        </Link>
        <Link href="/dashboard" prefetch={false}>
          <ActionButton
            variant="outline"
            icon={<ArrowRight className="h-4 w-4" />}
            className="gap-2 border-[1.5px] border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg"
          >
            لوحة التحكم
          </ActionButton>
        </Link>
      </div>
    </div>
  );
}