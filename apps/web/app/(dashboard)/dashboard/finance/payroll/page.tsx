"use client";

import {
  useGetEmployeesQuery,
  useRunPayrollMutation,
} from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { DataTable } from "@/components/design-system/DataTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import {
  Search,
  Wallet,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import Link from "next/link";
import { toast } from "sonner";

export default function PayrollPage() {
  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const [runPayroll, { isLoading: isRunning }] = useRunPayrollMutation();

  const handleRunPayroll = async () => {
    try {
      const now = new Date();
      await runPayroll({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      }).unwrap();
      toast.success("تم بدء عملية صرف الرواتب بنجاح");
    } catch (error) {
      toast.error("فشل في عملية صرف الرواتب");
    }
  };

  const totalPayroll = employees.reduce((sum, emp) => sum + emp.baseSalary, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الرواتب والأجور</h1>
          <p className="text-neutral-300">
            إدارة مستحقات الموظفين والبدلات والاستقطاعات.
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton variant="outline">إدارة الهيكل الوظيفي</ActionButton>
          <ActionButton
            variant="primary"
            onClick={handleRunPayroll}
            disabled={isRunning}
          >
            {isRunning ? (
              <Wallet className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4 ml-2" />
            )}
            صرف الرواتب الجماعي
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <SurfaceCard
          className="border-none shadow-sm"
          description="إجمالي رواتب الشهر الحالي"
        >
          <h3 className="text-2xl font-bold">
            {totalPayroll.toLocaleString()} ر.س
          </h3>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1 text-success-600 text-xs font-bold bg-success-50 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" />
              تكامل النظام: نشط
            </div>
          </div>
        </SurfaceCard>
      </div>

      <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
              <FormInputControl
                placeholder="بحث عن موظف..."
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <ActionButton variant="ghost" size="sm">
                تاريخ الصرف
              </ActionButton>
            </div>
          </div>
        </div>

        <DataTable
          columns={[
            { id: "employee", label: "الموظف" },
            { id: "salary", label: "الراتب الأساسي" },
            { id: "lastPaid", label: "آخر تاريخ صرف" },
            { id: "status", label: "الحالة" },
            { id: "actions", label: "الإجراءات", align: "left" },
          ]}
          data={employees}
          isLoading={isLoading}
          isError={false}
          emptyState={{
            icon: Wallet,
            message: "لا يوجد موظفون مسجلون",
            hint: "قم بإضافة موظفين من إعدادات النظام.",
          }}
          renderRow={(employee) => {
            const latestSalary = (employee as any).salaries?.[0];
            return (
              <tr className="border-b-[1.5px] border-portal-divider">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={employee.name}
                      size="md"
                      variant="circle"
                      showBorder
                      className="h-9 w-9"
                    />
                    <div>
                      <p className="font-bold text-sm">{employee.name}</p>
                      <p className="text-xs text-neutral-400">{employee.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {employee.baseSalary.toLocaleString()} ر.س
                </td>
                <td className="px-5 py-4 text-neutral-400 text-sm">
                  {latestSalary?.paymentDate
                    ? new Date(latestSalary.paymentDate).toLocaleDateString(
                        "ar-SA-u-nu-latn",
                      )
                    : "لم يتم الصرف"}
                </td>
                <td className="px-5 py-4">
                  <FinanceStatusBadge
                    status={latestSalary?.status || "PENDING"}
                  />
                </td>
                <td className="px-5 py-4 text-left">
                  <Link href={`/dashboard/finance/payroll/${employee.id}`}>
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      className="hover:bg-secondary-500/10 hover:text-secondary-500 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </ActionButton>
                  </Link>
                </td>
              </tr>
            );
          }}
        />
      </div>
    </div>
  );
}
