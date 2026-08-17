"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDetailBreadcrumb } from "./AdminDetailBreadcrumb";

interface AdminDetailErrorProps {
  title?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}

export function AdminDetailError({
  title = "حدث خطأ أثناء تحميل البيانات.",
  onRetry,
  backHref,
  backLabel,
}: AdminDetailErrorProps) {
  return (
    <div className="max-w-4xl" dir="rtl">
      {backHref && (
        <AdminDetailBreadcrumb
          backHref={backHref}
          backLabel={backLabel || "العودة"}
          title="خطأ"
        />
      )}
      <Card className="border-destructive/30 bg-destructive/5 mt-6">
        <CardHeader className="items-center text-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            يرجى المحاولة مرة أخرى أو العودة للصفحة السابقة.
          </CardDescription>
        </CardHeader>
        {onRetry && (
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={onRetry}>
              <RefreshCcw className="size-4" />
              إعادة المحاولة
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
