"use client";

import Link from "next/link";
import { SquareCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return (
    <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardContent className="p-8">
          <Empty>
            <EmptyMedia variant="icon">
              <SquareCheckBig />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>حدث خطأ في تحميل المهام</EmptyTitle>
              <EmptyDescription>{error.message || "تعذر تحميل البيانات. حاول مرة أخرى."}</EmptyDescription>
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
