"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PortalFinancePage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الصفحة المالية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          الفواتير والمدفوعات والعقود الخاصة بك.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الفواتير</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            عرض الفواتير وحالات الدفع.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الدفع</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            خيارات الدفع وسجل العمليات.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">العقود</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            تفاصيل العقود والاشتراكات.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
