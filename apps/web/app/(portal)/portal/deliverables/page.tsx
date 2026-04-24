"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DELIVERABLES = [
  { id: "d1", name: "تصميم بانر إعلاني", date: "2026-04-18" },
  { id: "d2", name: "خطة محتوى أسبوعية", date: "2026-04-21" },
];

export default function PortalDeliverablesPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">التسليمات</h1>
        <p className="text-sm text-muted-foreground mt-1">
          استعراض الأعمال وتسليمات المشروع.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة التسليمات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم العمل</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">تحميل</TableHead>
                <TableHead className="text-right">طلب تعديل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DELIVERABLES.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell dir="ltr">{item.date}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      تحميل
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      طلب تعديل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
