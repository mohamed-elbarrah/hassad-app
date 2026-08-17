"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  error: Error;
  reset?: () => void;
  backHref?: string;
  backLabel?: string;
}

export function ErrorFallback({
  error,
  reset,
  backHref,
  backLabel,
}: ErrorFallbackProps) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-8"
      dir="rtl"
    >
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="size-8 text-destructive" />
      </div>

      <div className="flex max-w-md flex-col items-center gap-2 text-center">
        <h2 className="text-xl font-semibold">حدث خطأ غير متوقع</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "تعذر تحميل هذه الصفحة. يرجى المحاولة مرة أخرى."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {reset && (
          <Button onClick={reset}>
            <RefreshCw data-icon="inline-start" />
            إعادة المحاولة
          </Button>
        )}
        {backHref && (
          <Button asChild variant="outline">
            <Link href={backHref}>
              <ArrowRight data-icon="inline-start" />
              {backLabel || "العودة"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
