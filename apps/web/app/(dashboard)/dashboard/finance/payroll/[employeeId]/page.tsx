"use client";

import { use } from "react";
import { useGetEmployeeByIdQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { TimelineComponent } from "@/components/dashboard/finance/TimelineComponent";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import {
  ChevronRight,
  Wallet,
  History,
  FileText,
  Plus,
  ArrowDown,
  ArrowUp,
  DollarSign,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function SalaryDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);

  const { data: employee, isLoading } = useGetEmployeeByIdQuery(employeeId);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center text-neutral-300">
        الموظف غير موجود
      </div>
    );
  }

  const netSalary = employee.baseSalary; // Bonuses/deductions are in the salaries history

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-neutral-300">
          <Link href="/dashboard/finance" className="hover:text-secondary-500">
            المالية
          </Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <Link
            href="/dashboard/finance/payroll"
            className="hover:text-secondary-500"
          >
            الرواتب
          </Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-natural-100 font-medium">{employee.name}</span>
        </div>
        <div className="flex gap-2">
          <ActionButton variant="outline" size="sm">
            <FileText className="w-4 h-4 ml-2" />
            تصدير مسير الرواتب
          </ActionButton>
          <ActionButton size="sm" variant="primary">
            <Wallet className="w-4 h-4 ml-2" />
            صرف المستحقات الحالية
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm">
            <div className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <UserAvatar
                  name={employee.name}
                  size="xl"
                  variant="circle"
                  showBorder
                  className="h-24 w-24 border-4 border-secondary-500/10 shadow-lg"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <h2 className="text-3xl font-bold">{employee.name}</h2>
                    <FinanceStatusBadge
                      status="ACTIVE"
                      className="w-fit self-center"
                    />
                  </div>
                  <p className="text-neutral-300 text-lg">
                    {employee.role}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                    <div className="bg-neutral-50/50 px-4 py-2 rounded-lg text-sm">
                      <span className="text-neutral-300 ml-2">
                        المعرف:
                      </span>
                      <span className="font-mono font-medium">
                        {employee.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm">
              <div className="p-6 pb-2">
                <p className="text-sm text-neutral-300 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> الراتب الأساسي
                </p>
                <h3 className="text-xl font-bold">
                  {employee.baseSalary.toLocaleString()} ر.س
                </h3>
              </div>
            </div>
            <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm">
              <div className="p-6 pb-2">
                <p className="text-sm text-success-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" /> الحوافز والبدلات
                </p>
                <h3 className="text-xl font-bold text-success-600">
                  0 ر.س
                </h3>
              </div>
            </div>
            <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm">
              <div className="p-6 pb-2">
                <p className="text-sm text-danger-600 flex items-center gap-1">
                  <ArrowDown className="w-3 h-3" /> الإستقطاعات
                </p>
                <h3 className="text-xl font-bold text-danger-600">
                  0 ر.س
                </h3>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <History className="w-5 h-5 text-secondary-500" />
                    سجل الدفعات السابقة
                  </h3>
                  <p className="text-sm text-neutral-300">
                    عرض جميع الرواتب التي تم صرفها لهذا الموظف
                  </p>
                </div>
                <ActionButton variant="outline" size="sm">
                  تحميل السجل
                </ActionButton>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر / السنة</TableHead>
                    <TableHead>المبلغ المصروف</TableHead>
                    <TableHead>تاريخ الصرف</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.salaries?.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">
                        {h.month}/{h.year}
                      </TableCell>
                      <TableCell className="font-bold">
                        {h.amount.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>
                        {h.paymentDate
                          ? new Date(h.paymentDate).toLocaleDateString(
                              "ar-SA-u-nu-latn",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <FinanceStatusBadge status={h.status as any} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!employee.salaries || employee.salaries.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 text-neutral-300"
                      >
                        لا توجد سجلات رواتب.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Sidebar: Details & Timeline */}
        <div className="space-y-6">
          <SurfaceCard
            className="border-none shadow-md"
            title="الجدول الزمني"
            description="إجراءات الصرف الحالية"
          >
            <TimelineComponent items={[]} />
          </SurfaceCard>

          <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm bg-secondary-500/5">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-semibold">إدارة البدلات</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>بدل سكن</span>
                <span className="font-bold">1,000 ر.س</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>بدل نقل</span>
                <span className="font-bold">500 ر.س</span>
              </div>
              <Separator />
              <ActionButton variant="outline" className="w-full text-xs">
                <Plus className="w-3 h-3 ml-1" />
                إضافة بدل أو استقطاع
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
