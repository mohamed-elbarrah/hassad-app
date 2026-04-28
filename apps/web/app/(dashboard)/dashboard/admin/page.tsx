"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetAdminStatsQuery } from "@/features/admin/adminApi";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceStatus } from "@hassad/shared";

function fmt(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("ar-DZ");
}

export default function AdminWorkspacePage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: stats, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: invoicesData, isLoading: invoicesLoading } = useGetInvoicesQuery({
    status: InvoiceStatus.DUE,
    limit: 5,
  });

  if (!user) return null;

  const KPI_ITEMS = [
    { label: "العملاء النشطين", value: statsLoading ? null : fmt(stats?.activeClients) },
    { label: "الإيرادات هذا الشهر", value: statsLoading ? null : `${fmt(stats?.monthlyRevenue)} دج` },
    { label: "المشاريع الجارية", value: statsLoading ? null : fmt(stats?.activeProjects) },
    { label: "رضا العملاء", value: statsLoading ? null : `${stats?.satisfactionRate ?? 0}%` },
  ];

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
              {item.value == null ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-semibold" dir="ltr">{item.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مؤشرات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <ul className="space-y-2 text-sm" dir="rtl">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">المهام المتأخرة</span>
                  <span className="font-semibold text-destructive">
                    {fmt(stats?.overdueTasks)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">الفواتير غير المسددة</span>
                  <span className="font-semibold text-amber-600">
                    {fmt(stats?.unpaidInvoicesCount)}
                  </span>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">الفواتير المستحقة</CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : !invoicesData?.items?.length ? (
              <p className="text-sm text-muted-foreground">لا توجد فواتير مستحقة.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicesData.items.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.client?.companyName ?? "—"}
                      </TableCell>
                      <TableCell dir="ltr">{fmt(invoice.amount)} دج</TableCell>
                      <TableCell dir="ltr">
                        {new Date(invoice.dueDate).toLocaleDateString("ar-DZ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
