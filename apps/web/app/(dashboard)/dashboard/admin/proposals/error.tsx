"use client";

import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";
import { adminErrorMessage } from "@/lib/i18n";

export default function Error({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminPageError
      title="حدث خطأ في تحميل عروض الأسعار"
      description={adminErrorMessage(error)}
    />
  );
}
