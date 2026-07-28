"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminPageErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function AdminPageError({
  title = "حدث خطأ",
  description = "تعذر تحميل البيانات. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
  onRetry,
}: AdminPageErrorProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="items-center text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center gap-2">
        <Button variant="outline" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      </CardContent>
    </Card>
  );
}
