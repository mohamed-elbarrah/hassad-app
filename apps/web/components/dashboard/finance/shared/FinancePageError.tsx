"use client";

import { EmptyState } from "@/components/design-system/EmptyState";
import type { LucideIcon } from "lucide-react";

interface FinancePageErrorProps {
  error?: Error;
  reset?: () => void;
  message?: string;
  hint?: string;
}

export function FinancePageError({
  error,
  reset,
  message = "حدث خطأ غير متوقع",
  hint = "يرجى المحاولة مرة أخرى.",
}: FinancePageErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[50vh] gap-4"
      dir="rtl"
    >
      <EmptyState
        icon={error ? (error as any).icon : undefined}
        title={message}
        hint={hint}
        action={
          reset ? (
            <button
              onClick={reset}
              className="text-secondary-500 hover:text-secondary-600 font-medium text-sm"
            >
              إعادة المحاولة
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
