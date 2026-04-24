"use client";

import { useAppSelector } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const KPI_ITEMS = [
  { label: "العملاء النشطين", value: "128" },
  { label: "الإيرادات هذا الشهر", value: "1,250,000 دج" },
  { label: "المشاريع الجارية", value: "34" },
  { label: "رضا العملاء", value: "92%" },
];

const OVERDUE_TASKS = [
  {
    id: "t1",
    title: "تسليم خطة حملة",
    project: "شركة النور",
    due: "2026-04-20",
  },
  {
    id: "t2",
    title: "مراجعة تصميم الهوية",
    project: "عيادة الحياة",
    due: "2026-04-18",
  },
];

const UNPAID_INVOICES = [
  {
    id: "i1",
    client: "شركة النور",
    amount: "120,000 دج",
    due: "2026-04-10",
  },
  {
    id: "i2",
    client: "مطعم الريحان",
    amount: "85,000 دج",
    due: "2026-04-12",
  },
];

export default function AdminWorkspacePage() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            لوحة الإدارة العليا
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مرحباً، {user.name || "الإدارة"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المهام المتأخرة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المهمة</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OVERDUE_TASKS.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.project}</TableCell>
                    <TableCell dir="ltr">{task.due}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">الفواتير غير المسددة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">القيمة</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {UNPAID_INVOICES.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.client}
                    </TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell dir="ltr">{invoice.due}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
