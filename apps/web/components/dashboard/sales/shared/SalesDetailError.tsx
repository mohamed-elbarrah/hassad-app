"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SalesDetailErrorProps {
  title: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}

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
      <AlertCircle className="mb-4 size-16 text-destructive" />
      <p className="mb-2 text-lg font-medium text-foreground">{title}</p>
      <p className="mb-6 text-sm text-muted-foreground">
        حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
      </p>
      <div className="flex items-center gap-3">
        {onRetry ? <Button onClick={onRetry}>إعادة المحاولة</Button> : null}
        {backHref && backLabel ? (
          <Button asChild variant="link" className="gap-2 px-0">
            <Link href={backHref}>
              <ArrowRight className="size-4" />
              {backLabel}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
