"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountantWorkspacePage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">لوحة المالية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          متابعة الفواتير والتذاكر المالية والعقود.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/accountant/invoices">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">الفواتير</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              مستحقة، مدفوعة، ومتأخرة.
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/accountant/tickets">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">التذاكر المالية</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              طلبات مالية داخلية.
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/accountant/contracts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">العقود (مالية)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              قيم العقود والرصيد المتبقي.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
