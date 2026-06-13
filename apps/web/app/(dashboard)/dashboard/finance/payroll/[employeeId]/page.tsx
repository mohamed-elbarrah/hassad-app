"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGetEmployeeByIdQuery, usePaySalaryMutation, useUpdateSalaryMutation } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { DataTable } from "@/components/design-system/DataTable";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import {
  ChevronRight,
  Wallet,
  History,
  Plus,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Loader2,
  Calendar,
  Hash,
  Pencil,
  FileText,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export default function SalaryDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);
  const searchParams = useSearchParams();

  const urlMonth = Number(searchParams.get("month"));
  const urlYear = Number(searchParams.get("year"));

  const now = new Date();
  const [month, setMonth] = useState(
    urlMonth && urlYear ? urlMonth : now.getMonth() + 1,
  );
  const [year, setYear] = useState(
    urlMonth && urlYear ? urlYear : now.getFullYear(),
  );

  const { data: employee, isLoading } = useGetEmployeeByIdQuery(employeeId);
  const [paySalary, { isLoading: isPaying }] = usePaySalaryMutation();
  const [updateSalary, { isLoading: isUpdating }] = useUpdateSalaryMutation();

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center text-neutral-400">الموظف غير موجود</div>
    );
  }

  const salary = (employee as any).salaries?.find(
    (s: any) => s.month === month && s.year === year,
  );

  const handlePay = async () => {
    if (!salary) return;
    try {
      await paySalary({ id: salary.id }).unwrap();
      toast.success(`تم صرف راتب ${employee.name} بنجاح`);
    } catch {
      toast.error("فشل في صرف الراتب");
    }
  };

  const handleUpdateAllowances = async () => {
    if (!salary) return;
    const bonuses = Number(prompt("البدلات والحوافز (ر.س):", String(salary.bonuses || 0)));
    if (isNaN(bonuses)) return;
    const deductions = Number(prompt("الاستقطاعات (ر.س):", String(salary.deductions || 0)));
    if (isNaN(deductions)) return;
    try {
      await updateSalary({ id: salary.id, bonuses, deductions }).unwrap();
      toast.success("تم تحديث البدلات والاستقطاعات");
    } catch {
      toast.error("فشل في التحديث");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
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

        <div className="flex items-center gap-2">
          <ActionButton variant="outline" size="sm" icon={<FileText className="w-4 h-4" />}>
            تصدير مسير الرواتب
          </ActionButton>
          {salary?.status === "PENDING" && (
            <ActionButton
              variant="primary"
              size="sm"
              icon={<Wallet className="w-4 h-4" />}
              onClick={handlePay}
              disabled={isPaying}
            >
              {isPaying ? "جاري الصرف..." : "صرف المستحقات"}
            </ActionButton>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ─── Main Column (2/3) ─── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile Card */}
          <SurfaceCard className="border-none shadow-md overflow-hidden">
            <div className="bg-secondary-500 h-2 w-full" />
            <div className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
              <UserAvatar
                name={employee.name}
                size="xl"
                variant="circle"
                showBorder
                className="h-20 w-20 border-4 border-secondary-500/10 shadow-lg"
              />
              <div className="flex-1 space-y-1 text-center md:text-right">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h2 className="text-2xl font-bold">{employee.name}</h2>
                  <FinanceStatusBadge status={employee.isActive ? "ACTIVE" : "CANCELLED"} />
                </div>
                <p className="text-neutral-400">{employee.role}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                  <span className="bg-neutral-50 px-3 py-1 rounded-lg text-xs font-mono">
                    <Hash className="w-3 h-3 inline ml-1" />{employee.id}
                  </span>
                  <span className="bg-neutral-50 px-3 py-1 rounded-lg text-xs">
                    الراتب الأساسي: <CurrencyDisplay amount={employee.baseSalary} />
                  </span>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* Month Selector + Salary Breakdown */}
          <SurfaceCard
            title={`راتب ${MONTHS[month - 1]} ${year}`}
            icon={Calendar}
            className="border-none shadow-sm"
            action={
              <div className="flex items-center gap-2">
                <select
                  value={`${month}-${year}`}
                  onChange={(e) => {
                    const [m, y] = e.target.value.split("-").map(Number);
                    setMonth(m);
                    setYear(y);
                  }}
                  className="h-9 px-3 rounded-lg border border-portal-card-border bg-natural-0 text-sm appearance-none"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    return (
                      <option key={i} value={`${d.getMonth() + 1}-${d.getFullYear()}`}>
                        {MONTHS[d.getMonth()]} {d.getFullYear()}
                      </option>
                    );
                  })}
                </select>
              </div>
            }
          >
            {!salary ? (
              <div className="text-center py-8">
                <p className="text-neutral-400">لم يتم توليد راتب لهذا الشهر</p>
                <ActionButton
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    window.location.href = "/dashboard/finance/payroll";
                  }}
                >
                  الذهاب لتوليد الراتب
                </ActionButton>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-2xl bg-neutral-50/50">
                    <p className="text-xs text-neutral-400 mb-1">الأساسي</p>
                    <p className="text-lg font-bold"><CurrencyDisplay amount={salary.baseSalary} /></p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-success-50/50">
                    <p className="text-xs text-success-600 mb-1 flex items-center justify-center gap-1">
                      <ArrowUp className="w-3 h-3" />البدلات
                    </p>
                    <p className="text-lg font-bold text-success-600"><CurrencyDisplay amount={salary.bonuses || 0} /></p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-danger-50/50">
                    <p className="text-xs text-danger-600 mb-1 flex items-center justify-center gap-1">
                      <ArrowDown className="w-3 h-3" />الاستقطاعات
                    </p>
                    <p className="text-lg font-bold text-danger-600"><CurrencyDisplay amount={salary.deductions || 0} /></p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-secondary-50/50">
                    <p className="text-xs text-secondary-600 mb-1">الصافي</p>
                    <p className="text-lg font-bold text-secondary-600"><CurrencyDisplay amount={salary.amount} /></p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <FinanceStatusBadge status={salary.status} className="text-base px-3 py-1" />
                    {salary.paymentDate && (
                      <span className="text-sm text-neutral-400">
                        تاريخ الصرف:{" "}
                        {new Date(salary.paymentDate).toLocaleDateString("ar-SA-u-nu-latn")}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {salary.status === "PENDING" && (
                      <>
                        <ActionButton
                          variant="outline"
                          size="sm"
                          icon={<Pencil className="w-4 h-4" />}
                          onClick={handleUpdateAllowances}
                          disabled={isUpdating}
                        >
                          تعديل البدلات
                        </ActionButton>
                        <ActionButton
                          variant="primary"
                          size="sm"
                          icon={<Wallet className="w-4 h-4" />}
                          onClick={handlePay}
                          disabled={isPaying}
                        >
                          {isPaying ? "جاري..." : "صرف"}
                        </ActionButton>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SurfaceCard>

          {/* Salary History */}
          <SurfaceCard
            title="سجل الرواتب"
            description="جميع الدفعات السابقة"
            icon={History}
            className="border-none shadow-md"
          >
            <DataTable
              columns={[
                { id: "month", label: "الشهر / السنة" },
                { id: "base", label: "الأساسي" },
                { id: "bonuses", label: "البدلات" },
                { id: "deductions", label: "الاستقطاعات" },
                { id: "amount", label: "الصافي" },
                { id: "status", label: "الحالة" },
                { id: "date", label: "تاريخ الصرف", align: "left" },
              ]}
              data={(employee as any).salaries || []}
              isLoading={isLoading}
              isError={false}
              emptyState={{
                icon: History,
                message: "لا يوجد سجل رواتب",
                hint: "سيتم عرض السجل بعد أول صرف.",
              }}
              renderRow={(s: any) => (
                <tr className="border-b-[1.5px] border-portal-divider">
                  <td className="px-5 py-4 font-medium">
                    {MONTHS[s.month - 1]} {s.year}
                  </td>
                  <td className="px-5 py-4"><CurrencyDisplay amount={s.baseSalary} /></td>
                  <td className="px-5 py-4 text-success-600">+<CurrencyDisplay amount={s.bonuses || 0} /></td>
                  <td className="px-5 py-4 text-danger-600">-<CurrencyDisplay amount={s.deductions || 0} /></td>
                  <td className="px-5 py-4 font-bold"><CurrencyDisplay amount={s.amount} /></td>
                  <td className="px-5 py-4">
                    <FinanceStatusBadge status={s.status} />
                  </td>
                  <td className="px-5 py-4 text-left text-xs text-neutral-400">
                    {s.paymentDate
                      ? new Date(s.paymentDate).toLocaleDateString("ar-SA-u-nu-latn")
                      : "—"}
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </div>

        {/* ─── Sidebar (1/3) ─── */}
        <div className="space-y-5">
          {/* Pay Configuration */}
          <SurfaceCard
            title="إعدادات الراتب"
            icon={DollarSign}
            className="border-none shadow-sm"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">نوع الراتب</span>
                <span className="text-sm font-bold">
                  {employee.payType === "HYBRID"
                    ? "ثابت + عمولة"
                    : employee.payType === "COMMISSION"
                      ? "عمولة فقط"
                      : employee.payType === "HOURLY"
                        ? "بالساعة"
                        : "ثابت"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">الراتب الأساسي</span>
                <span className="text-sm font-bold"><CurrencyDisplay amount={employee.baseSalary} /></span>
              </div>
              {employee.commissionRate && employee.commissionRate > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">نسبة العمولة</span>
                  <span className="text-sm font-bold text-secondary-600">{Math.round(employee.commissionRate * 100)}%</span>
                </div>
              )}
              {employee.hourlyRate && employee.hourlyRate > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">الأجر بالساعة</span>
                  <span className="text-sm font-bold"><CurrencyDisplay amount={employee.hourlyRate} /></span>
                </div>
              )}
              <div className="pt-2 border-t border-portal-divider">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-xs"
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={() => alert("سيتم فتح نموذج تعديل الإعدادات")}
                >
                  تعديل الإعدادات
                </ActionButton>
              </div>
            </div>
          </SurfaceCard>

          {/* Quick Actions */}
          <SurfaceCard className="border-none shadow-sm">
            <div className="p-4 space-y-2">
              {salary?.status === "PENDING" ? (
                <ActionButton
                  variant="primary"
                  className="w-full justify-center"
                  icon={<Wallet className="w-4 h-4" />}
                  onClick={handlePay}
                  disabled={isPaying}
                >
                  {isPaying ? "جاري الصرف..." : "صرف الراتب الحالي"}
                </ActionButton>
              ) : salary?.status === "PAID" ? (
                <div className="text-center py-3">
                  <CheckCircle2 className="w-10 h-10 text-success-500 mx-auto mb-2" />
                  <p className="text-success-600 font-bold">تم الصرف</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {salary.paymentDate
                      ? new Date(salary.paymentDate).toLocaleDateString("ar-SA-u-nu-latn")
                      : ""}
                  </p>
                </div>
              ) : (
                <ActionButton
                  variant="outline"
                  className="w-full justify-center"
                  disabled
                >
                  لا يوجد راتب لهذا الشهر
                </ActionButton>
              )}

              {salary && (
                <ActionButton
                  variant="outline"
                  className="w-full justify-center"
                  icon={<Pencil className="w-4 h-4" />}
                  onClick={handleUpdateAllowances}
                  disabled={salary.status === "PAID" || isUpdating}
                >
                  تعديل البدلات والاستقطاعات
                </ActionButton>
              )}

              <ActionButton
                variant="ghost"
                className="w-full justify-center"
                icon={<FileText className="w-4 h-4" />}
              >
                تحميل قسيمة الراتب
              </ActionButton>
            </div>
          </SurfaceCard>

          {/* Notes */}
          {salary?.notes && (
            <SurfaceCard className="border-none shadow-sm">
              <div className="p-4">
                <p className="text-sm text-neutral-500">{salary.notes}</p>
              </div>
            </SurfaceCard>
          )}
        </div>
      </div>
    </div>
  );
}
