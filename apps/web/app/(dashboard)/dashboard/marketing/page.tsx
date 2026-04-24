"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketingWorkspacePage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">لوحة التسويق</h1>
        <p className="text-sm text-muted-foreground mt-1">
          متابعة العملاء والحملات والمؤشرات الأساسية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/marketing/clients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">صفحة العملاء</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              عرض قائمة العملاء والحملات المرتبطة بهم.
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/marketing/campaigns">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">صفحة الحملات</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              إدارة الحملات ومتابعة الأداء.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
