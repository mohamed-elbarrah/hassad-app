"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
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

export default function Error() {
  return (
    <div dir="rtl" className="  ">
      <Card>
        <CardContent className="p-8">
          <Empty>
            <EmptyMedia variant="icon">
              <Sparkles />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>حدث خطأ أثناء تحميل العرض</EmptyTitle>
              <EmptyDescription>تعذر جلب التفاصيل حاليًا.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/dashboard/sales/proposals">
                  <ArrowLeft data-icon="inline-start" />
                  العودة إلى العروض
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
