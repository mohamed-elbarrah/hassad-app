"use client";

import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SUMMARY_CARDS = [
  { title: "آخر تسليم", value: "تصميم بانر إعلاني" },
  { title: "حالة الحملة", value: "قيد الإطلاق" },
  { title: "الفاتورة القادمة", value: "10 مايو" },
];

export default function PortalPage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">مرحباً، {user?.name} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">
          هذه نظرة سريعة على تقدم المشروع.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">التقدم العام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>65% من المشروع</span>
            <span>65%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: "65%" }} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUMMARY_CARDS.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/portal/deliverables">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">التسليمات</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              استعرض الأعمال واعتمدها.
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/reports">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">التقارير</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              تقارير الحملات لمنصات الإعلانات.
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/finance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">المالية</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              الفواتير والمدفوعات والعقود.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
