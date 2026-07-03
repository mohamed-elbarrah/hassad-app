"use client";

import { AlertCircle } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SalesDetailErrorProps {
  title: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}

/**
 * Error state for sales detail pages.
 * Mirrors the portal `DetailErrorState` pattern.
 */
export function SalesDetailError({
  title,
  onRetry,
  backHref,
  backLabel,
}: SalesDetailErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      dir="rtl"
    >
      <AlertCircle className="w-16 h-16 text-danger-500 mb-4" />
      <p className="text-lg font-medium text-natural-100 mb-2">{title}</p>
      <p className="text-sm text-portal-note-text mb-6">
        حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
      </p>
      <div className="flex items-center gap-3">
        {onRetry && (
          <ActionButton variant="primary" onClick={onRetry}>
            إعادة المحاولة
          </ActionButton>
        )}
        {backHref && backLabel && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-secondary-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
