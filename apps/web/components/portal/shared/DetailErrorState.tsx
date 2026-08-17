"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function DetailErrorState({
  title,
  onRetry,
  backHref,
  backLabel,
}: {
  title: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div dir="rtl">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>
            حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {onRetry && <Button onClick={onRetry}>إعادة المحاولة</Button>}
          {backHref && backLabel && (
            <Button asChild variant="outline">
              <Link href={backHref}>
                <ArrowRight />
                {backLabel}
              </Link>
            </Button>
          )}
        </EmptyContent>
      </Empty>
    </div>
  );
}
