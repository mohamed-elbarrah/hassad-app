"use client";

import { useState } from "react";
import { Kanban, Search, DollarSign } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { StatCard } from "@/components/design-system/StatCard";
import { toast } from "sonner";
import {
  useGetEmployeesQuery,
  useRunPayrollMutation,
  usePayAllSalariesMutation,
  usePreviewPayrollQuery,
} from "@/features/finance/financeApi";

const PAY_TYPE_MAP: Record<string, string> = {
  MONTHLY: "شهري",
  COMMISSION: "عمولة",
  HOURLY: "ساعي",
};

export default function AdminPayrollPage() {
  const [search, setSearch] = useState("");
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  const { data: employees, isLoading } = useGetEmployeesQuery();
  const [runPayroll] = useRunPayrollMutation();
  const [payAll] = usePayAllSalariesMutation();
  const { data: preview } = usePreviewPayrollQuery(
    { month: payrollMonth, year: payrollYear },
    { skip: !showRunPayroll },
  );

  const filtered = (employees ?? []).filter(
    (e: any) => e.name?.includes(search) || e.role?.includes(search),
  );

  const totalSalaries = (employees ?? []).reduce(
    (sum: number, e: any) => sum + (e.baseSalary ?? 0),
    0,
  );
  const activeCount = (employees ?? []).filter(
    (e: any) => e.isActive !== false,
  ).length;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="الرواتب والأجور"
        description="إدارة رواتب الموظفين"
        icon={Kanban}
        actions={
          <ActionButton size="md" onClick={() => setShowRunPayroll(true)}>
            <DollarSign className="size-4 ml-1" />
            تشغيل الرواتب
          </ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="إجمالي الرواتب"
          value={`${totalSalaries?.toLocaleString()} ر.س`}
          icon={DollarSign}
        />
        <StatCard
          title="الموظفين النشطين"
          value={`${activeCount}`}
          icon={Kanban}
        />
        <StatCard
          title="إجمالي الموظفين"
          value={`${employees?.length ?? 0}`}
          icon={Kanban}
        />
      </div>

      <SurfaceCard>
        <div className="relative max-w-sm mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
          <FormInputControl
            placeholder="ابحث عن موظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <DataTable
          columns={[
            { id: "name", label: "الاسم" },
            { id: "role", label: "الدور" },
            { id: "payType", label: "نوع الراتب" },
            { id: "baseSalary", label: "الراتب الأساسي" },
            { id: "status", label: "الحالة" },
          ]}
          data={filtered}
          isLoading={isLoading}
          isError={false}
          emptyState={{
            icon: Kanban,
            message: "لا توجد موظفين",
            hint: "لم يتم إضافة موظفين بعد",
          }}
          renderRow={(e: any) => (
            <tr key={e.id} className="border-b border-portal-divider">
              <td className="px-5 py-3 text-sm font-medium">{e.name}</td>
              <td className="px-5 py-3 text-sm text-portal-note-text">
                {e.role}
              </td>
              <td className="px-5 py-3 text-sm">
                <Pill tone="neutral">
                  {PAY_TYPE_MAP[e.payType] ?? e.payType}
                </Pill>
              </td>
              <td className="px-5 py-3 text-sm">
                {e.baseSalary?.toLocaleString()} ر.س
              </td>
              <td className="px-5 py-3">
                <StatusBadge
                  status={e.isActive ? "ACTIVE" : "INACTIVE"}
                  label={e.isActive ? "نشط" : "غير نشط"}
                />
              </td>
            </tr>
          )}
        />
      </SurfaceCard>

      <Dialog
        open={showRunPayroll}
        onOpenChange={setShowRunPayroll}
        title="تشغيل الرواتب"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setShowRunPayroll(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              onClick={async () => {
                try {
                  const result = await runPayroll({
                    month: payrollMonth,
                    year: payrollYear,
                  }).unwrap();
                  toast.success(`تم إنشاء ${result.generated} راتب`);
                  setShowRunPayroll(false);
                } catch {
                  toast.error("فشل تشغيل الرواتب");
                }
              }}
            >
              تشغيل
            </ActionButton>
            <ActionButton
              onClick={async () => {
                try {
                  const result = await payAll({
                    month: payrollMonth,
                    year: payrollYear,
                  }).unwrap();
                  toast.success(
                    `تم دفع ${result.paid} من ${result.total} راتب`,
                  );
                  setShowRunPayroll(false);
                } catch {
                  toast.error("فشل دفع الرواتب");
                }
              }}
            >
              تشغيل ودفع الكل
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-portal-note-text mb-1">
                الشهر
              </label>
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {
                      [
                        "يناير",
                        "فبراير",
                        "مارس",
                        "أبريل",
                        "مايو",
                        "يونيو",
                        "يوليو",
                        "أغسطس",
                        "سبتمبر",
                        "أكتوبر",
                        "نوفمبر",
                        "ديسمبر",
                      ][i]
                    }
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-portal-note-text mb-1">
                السنة
              </label>
              <select
                value={payrollYear}
                onChange={(e) => setPayrollYear(Number(e.target.value))}
                className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {preview && (
            <div className="rounded-2xl bg-badge-gray-bg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>التكلفة الإجمالية</span>
                <span className="font-medium">
                  {preview.totalCost?.toLocaleString()} ر.س
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>الموظفين المعلقين</span>
                <span className="font-medium">{preview.pendingCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>غير منشأة</span>
                <span className="font-medium">{preview.notGenerated}</span>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
