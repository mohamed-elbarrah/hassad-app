"use client";

import { useGetLedgerQuery } from "@/features/finance/financeApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Search,
  ShieldCheck,
  Download,
  Filter,
  User,
  Calendar,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function LedgerPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetLedgerQuery({ page });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  const ledger = data?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-secondary-500/10 text-secondary-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              سجل التدقيق المالي
            </h1>
            <p className="text-neutral-300">
              تتبع جميع التغييرات والعمليات المالية بدقة (نظام غير قابل للحذف).
            </p>
          </div>
        </div>
        <ActionButton variant="outline">
          <Download className="w-4 h-4 ml-2" />
          تصدير سجل التدقيق
        </ActionButton>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="إجمالي العمليات"
          value={data?.total || 0}
          icon={ArrowRightLeft}
        />
        <StatCard
          title="عمليات اليوم"
          value={
            ledger.filter(
              (l) =>
                new Date(l.createdAt).toDateString() ===
                new Date().toDateString(),
            ).length
          }
          icon={Calendar}
        />
        <StatCard
          title="تعديلات حساسة"
          value={
            ledger.filter(
              (l) =>
                l.action.includes("PAYROLL") || l.action.includes("PAYMENT"),
            ).length
          }
          icon={Filter}
          className="text-alert-600"
        />
        <StatCard
          title="تكامل النظام"
          value="نشط"
          icon={ShieldCheck}
          className="text-success-600"
        />
      </div>

      <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm overflow-hidden">
        <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
              <FormInputControl placeholder="بحث في السجلات..." className="pr-10" />
            </div>
            <div className="flex gap-2">
              <ActionButton variant="outline" size="sm">
                تصفية حسب المستخدم
              </ActionButton>
              <ActionButton variant="outline" size="sm">
                تصفية حسب التاريخ
              </ActionButton>
            </div>
          </div>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pr-6">العملية</TableHead>
                <TableHead>الكيان المتأثر</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>القيمة السابقة</TableHead>
                <TableHead>القيمة الجديدة</TableHead>
                <TableHead className="text-left pl-6">التاريخ والوقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((log) => (
                <TableRow
                  key={log.id}
                  className="group transition-colors border-b last:border-0"
                >
                  <TableCell className="pr-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                      <span className="font-bold text-sm">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={log.entity}
                      className="font-mono text-[10px] uppercase"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-neutral-300" />
                      <span className="text-sm">{log.userId || "System"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-300 text-xs">
                    {log.before
                      ? typeof log.before === "string"
                        ? log.before
                        : JSON.stringify(log.before).substring(0, 30) + "..."
                      : "-"}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-secondary-500">
                    {log.after
                      ? typeof log.after === "string"
                        ? log.after
                        : JSON.stringify(log.after).substring(0, 30) + "..."
                      : "-"}
                  </TableCell>
                  <TableCell className="text-left pl-6 text-neutral-300 text-xs font-mono">
                    {new Date(log.createdAt).toLocaleString("ar-SA-u-nu-latn")}
                  </TableCell>
                </TableRow>
              ))}
              {ledger.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-neutral-300"
                  >
                    لا توجد سجلات حالياً.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  className,
}: {
  title: string;
  value: string | number;
  icon: any;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm">
      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-neutral-300">{title}</p>
          <p className={cn("text-xl font-bold", className)}>{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <Icon className="w-5 h-5 text-neutral-300" />
        </div>
      </div>
    </div>
  );
}
