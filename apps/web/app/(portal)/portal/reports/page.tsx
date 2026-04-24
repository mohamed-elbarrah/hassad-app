"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REPORTS = [
  { id: "r1", name: "Meta Ads" },
  { id: "r2", name: "Google Ads" },
  { id: "r3", name: "TikTok" },
];

export default function PortalReportsPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">التقارير</h1>
        <p className="text-sm text-muted-foreground mt-1">
          تقارير الحملات الإعلانية حسب المنصة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORTS.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="text-base">{report.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              مخطط الأداء سيظهر هنا.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
