"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-8">
          <Empty>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>حدث خطأ أثناء تحميل الموظفين</EmptyTitle>
              <EmptyDescription>
                {error.message || "تعذر تحميل البيانات. حاول مرة أخرى."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={reset}>إعادة المحاولة</Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
