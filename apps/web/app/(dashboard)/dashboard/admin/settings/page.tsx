"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_ITEMS = ["Admin", "Manager", "Sales", "Employee", "صلاحيات مخصصة"];

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الإعدادات والصلاحيات</h1>
        <p className="text-sm text-muted-foreground mt-1">
          إدارة المستخدمين وتحديد الأدوار والصلاحيات.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إضافة مستخدم</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          نموذج إضافة المستخدمين سيتم إظهاره هنا.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الأدوار المتاحة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ROLE_ITEMS.map((role) => (
            <span
              key={role}
              className="px-3 py-1 text-sm rounded-full bg-muted"
            >
              {role}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
