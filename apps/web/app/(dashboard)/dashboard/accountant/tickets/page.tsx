"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinanceTicketsPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">التذاكر المالية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          طلبات مالية داخلية ومتابعة الحالة.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">طلبات مالية</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          قائمة التذاكر المالية ستظهر هنا.
        </CardContent>
      </Card>
    </div>
  );
}
