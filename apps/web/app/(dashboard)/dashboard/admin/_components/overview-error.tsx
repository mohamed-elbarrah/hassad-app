"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function OverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Empty className="max-w-xl">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle />
          </EmptyMedia>
          <EmptyTitle>تعذر تحميل لوحة الإدارة</EmptyTitle>
          <EmptyDescription>
            {error.message || "حدث خطأ أثناء تحميل البيانات. حاول مرة أخرى."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset}>إعادة المحاولة</Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
