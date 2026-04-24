"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KPI_ITEMS = [
  { label: "الميزانية", value: "50,000 دج" },
  { label: "الظهور", value: "120,000" },
  { label: "النقرات", value: "8,200" },
  { label: "التحويلات", value: "320" },
  { label: "CAC", value: "150 دج" },
];

export default function CampaignDetailPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">تفاصيل الحملة</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مؤشرات الأداء الأساسية للحملة.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {KPI_ITEMS.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
