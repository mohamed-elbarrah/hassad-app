"use client";

import { AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
      className="flex flex-col items-center justify-center min-h-[50vh] gap-6 p-8"
      dir="rtl"
    >
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-xl font-semibold">حدث خطأ غير متوقع</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "تعذر تحميل هذه الصفحة. يرجى المحاولة مرة أخرى."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {reset && (
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        )}
        {backHref && (
          <Button asChild variant="outline" className="gap-2">
            <Link href={backHref}>
              <ArrowRight className="h-4 w-4" />
              {backLabel || "العودة"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
