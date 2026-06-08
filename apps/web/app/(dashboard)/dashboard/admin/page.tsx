"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetAdminStatsQuery } from "@/features/admin/adminApi";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/design-system/Skeleton";
import { InvoiceStatus } from "@hassad/shared";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export default function AdminWorkspacePage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: stats, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: invoicesData, isLoading: invoicesLoading } =
    useGetInvoicesQuery({
      status: InvoiceStatus.DUE,
      limit: 5,
    });

  if (!user) return null;

  const KPI_ITEMS = [
    {
      label: "العملاء النشطين",
      value: statsLoading ? null : formatNumber(stats?.activeClients),
    },
    {
      label: "الإيرادات هذا الشهر",
      value: statsLoading ? null : formatCurrency(stats?.monthlyRevenue),
    },
    {
      label: "المشاريع الجارية",
      value: statsLoading ? null : formatNumber(stats?.activeProjects),
    },
    {
      label: "رضا العملاء",
      value: statsLoading ? null : `${stats?.satisfactionRate ?? 0}%`,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            لوحة الإدارة العليا
          </h1>
          <p className="text-sm text-neutral-300 mt-1">
            مرحباً، {user.name || "الإدارة"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPI_ITEMS.map((item) => (
          <SurfaceCard title={item.label} key={item.label}>
            {item.value == null ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-semibold" dir="ltr">
                {item.value}
              </p>
            )}
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard title="مؤشرات إضافية">
          {statsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : (
            <ul className="space-y-2 text-sm" dir="rtl">
              <li className="flex justify-between">
                <span className="text-neutral-300">المهام المتأخرة</span>
                <span className="font-semibold text-danger-500">
                  {formatNumber(stats?.overdueTasks)}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-neutral-300">الفواتير غير المسددة</span>
                <span className="font-semibold text-alert-600">
                  {formatNumber(stats?.unpaidInvoicesCount)}
                </span>
              </li>
            </ul>
          )}
        </SurfaceCard>

        <SurfaceCard title="الفواتير المستحقة">
          {invoicesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : !invoicesData?.items?.length ? (
            <p className="text-sm text-neutral-300">لا توجد فواتير مستحقة.</p>
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
                    <TableCell dir="ltr">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell dir="ltr">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
