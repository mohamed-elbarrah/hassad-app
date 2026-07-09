"use client";

import { useState, useMemo } from "react";
import { Kanban, Search, DollarSign, History, CreditCard, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { StatCard } from "@/components/design-system/StatCard";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";
import { PAY_TYPE_AR, SALARY_STATUS_AR } from "@hassad/shared";
import {
  useGetEmployeesQuery,
  useRunPayrollMutation,
  usePayAllSalariesMutation,
  usePaySalaryMutation,
  usePreviewPayrollQuery,
} from "@/features/finance/financeApi";
import {
  useGetAdminFinanceOverviewQuery,
} from "@/features/admin/adminApi";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function AdminPayrollPage() {
  const { fmtAmount, currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(CURRENT_YEAR);
  const [activeTab, setActiveTab] = useState("employees");
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(CURRENT_YEAR);
  const [employeeMonth, setEmployeeMonth] = useState(new Date().getMonth() + 1);
  const [employeeYear, setEmployeeYear] = useState(CURRENT_YEAR);

  const { data: employees, isLoading } = useGetEmployeesQuery();
  const [runPayroll] = useRunPayrollMutation();
  const [payAll] = usePayAllSalariesMutation();
  const [paySalary, { isLoading: payingSalary }] = usePaySalaryMutation();
  const { data: preview } = usePreviewPayrollQuery(
    { month: payrollMonth, year: payrollYear },
    { skip: !showRunPayroll },
  );

  const filtered = useMemo(() => {
    return (employees ?? []).filter(
      (e: any) => e.name?.includes(search) || e.role?.includes(search),
    ).map((e: any) => {
      const latestSalary = e.salaries?.[0];
      const salaryStatus = latestSalary?.status;
      return {
        ...e,
        latestSalaryStatus: salaryStatus,
        latestSalary: latestSalary,
        latestCommission: latestSalary?.bonuses,
        latestDeduction: latestSalary?.deductions,
      };
    });
  }, [employees, search]);

  const totalSalaries = (employees ?? []).reduce(
    (sum: number, e: any) => sum + (e.baseSalary ?? 0),
    0,
  );
  const activeCount = (employees ?? []).filter(
    (e: any) => e.isActive !== false,
  ).length;

  const paidCount = filtered.filter(
    (e: any) => e.latestSalaryStatus === "PAID",
  ).length;
  const pendingSalaryCount = filtered.filter(
    (e: any) => e.latestSalaryStatus === "PENDING",
  ).length;

  const handlePayEmployee = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من دفع راتب ${name}؟`)) return;
    try {
      await paySalary({ id }).unwrap();
      toast.success(`تم دفع راتب ${name}`);
    } catch {
      toast.error("فشل دفع الراتب");
    }
  };

  const maxHistoryCost = 1;

  const getSalaryStatusLabel = (status: string | undefined) => {
    if (!status) return "—";
    return SALARY_STATUS_AR[status as keyof typeof SALARY_STATUS_AR] ?? status;
  };

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
        <StatCard title="إجمالي الرواتب" value={`${fmtAmount(totalSalaries)} ${currency.symbol}`} icon={DollarSign} />
        <StatCard title="الموظفين النشطين" value={`${activeCount}`} icon={Kanban} />
        <StatCard title="إجمالي الموظفين" value={`${employees?.length ?? 0}`} icon={Kanban} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="w-full justify-start gap-1">
          <TabsTrigger value="employees">
            <Kanban className="size-4 ml-1" />
            الموظفون
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="size-4 ml-1" />
            سجل الرواتب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <SurfaceCard>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative max-w-sm flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
                <FormInputControl
                  placeholder="ابحث عن موظف..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={employeeMonth}
                  onChange={(e) => setEmployeeMonth(Number(e.target.value))}
                  className="w-32 rounded-xl border border-portal-divider px-3 py-2.5 text-sm"
                >
                  {MONTHS_AR.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={employeeYear}
                  onChange={(e) => setEmployeeYear(Number(e.target.value))}
                  className="w-28 rounded-xl border border-portal-divider px-3 py-2.5 text-sm"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <DataTable
              columns={[
                { id: "name", label: "الاسم" },
                { id: "role", label: "الدور" },
                { id: "payType", label: "نوع الراتب" },
                { id: "baseSalary", label: "الراتب الأساسي" },
                { id: "commissions", label: "العمولات" },
                { id: "deductions", label: "الخصومات" },
                { id: "salaryStatus", label: "حالة الراتب" },
                { id: "status", label: "الحالة" },
                { id: "actions", label: "", align: "left" },
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
                  <td className="px-5 py-3 text-sm text-portal-note-text">{e.role}</td>
                  <td className="px-5 py-3 text-sm">
                    <Pill tone="neutral">{PAY_TYPE_AR[e.payType] ?? e.payType}</Pill>
                  </td>
                  <td className="px-5 py-3 text-sm">{fmtAmount(e.baseSalary)} {currency.symbol}</td>
                  <td className="px-5 py-3 text-sm">
                    {e.latestCommission != null ? (
                      <span className="text-success-600">{fmtAmount(e.latestCommission)} {currency.symbol}</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    {e.latestDeduction != null ? (
                      <span className="text-danger-600">{fmtAmount(e.latestDeduction)} {currency.symbol}</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {e.latestSalaryStatus ? (
                      <StatusBadge
                        status={e.latestSalaryStatus}
                        label={getSalaryStatusLabel(e.latestSalaryStatus)}
                      />
                    ) : (
                      <span className="text-xs text-portal-note-text">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={e.isActive ? "ACTIVE" : "INACTIVE"} label={e.isActive ? "نشط" : "غير نشط"} />
                  </td>
                  <td className="px-5 py-3 text-left">
                    <ActionButton
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePayEmployee(e.id, e.name)}
                      disabled={payingSalary || e.latestSalaryStatus === "PAID"}
                    >
                      <CreditCard className="size-4 ml-1" />
                      {e.latestSalaryStatus === "PAID" ? "مدفوع" : "دفع الراتب"}
                    </ActionButton>
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-6">
          {/* Month filter */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm text-portal-note-text mb-1">الشهر</label>
              <select
                value={historyMonth}
                onChange={(e) => setHistoryMonth(Number(e.target.value))}
                className="w-40 rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
              >
                {MONTHS_AR.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-portal-note-text mb-1">السنة</label>
              <select
                value={historyYear}
                onChange={(e) => setHistoryYear(Number(e.target.value))}
                className="w-32 rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="مدفوع" value={`${paidCount}`} icon={CheckCircle2} variant="success" />
            <StatCard title="معلق" value={`${pendingSalaryCount}`} icon={AlertCircle} variant="warning" />
            <StatCard title="إجمالي" value={`${filtered.length}`} icon={Kanban} />
          </div>

          {/* Bar chart comparison */}
          <SurfaceCard>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="size-5 text-secondary-500" />
              <h3 className="font-semibold text-natural-100">حالة رواتب الموظفين</h3>
            </div>
            <div className="flex items-end gap-3 h-44 px-2">
              {filtered.slice(0, 8).map((e: any) => {
                const maxBase = Math.max(1, ...filtered.map((f: any) => f.baseSalary));
                const heightPct = (e.baseSalary / maxBase) * 100;
                const isPaid = e.latestSalaryStatus === "PAID";
                return (
                  <div key={e.id} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs text-portal-note-text">
                      {fmtAmount(e.baseSalary)}
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: isPaid ? "#22c55e" : e.latestSalaryStatus === "PENDING" ? "#f59e0b" : "#e5e7eb",
                        minHeight: "8px",
                      }}
                    />
                    <span className="text-xs text-portal-note-text truncate max-w-[60px]">
                      {e.name?.slice(0, 4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </SurfaceCard>

          {/* History table */}
          <SurfaceCard>
            <h3 className="font-semibold text-natural-100 mb-4">تفاصيل الرواتب</h3>
            <DataTable
              columns={[
                { id: "name", label: "الاسم" },
                { id: "baseSalary", label: "الراتب الأساسي" },
                { id: "commissions", label: "العمولات" },
                { id: "deductions", label: "الخصومات" },
                { id: "salaryStatus", label: "الحالة" },
              ]}
              data={filtered}
              isLoading={false}
              isError={false}
              emptyState={undefined}
              renderRow={(e: any) => (
                <tr key={e.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium">{e.name}</td>
                  <td className="px-5 py-3 text-sm">{fmtAmount(e.baseSalary)} {currency.symbol}</td>
                  <td className="px-5 py-3 text-sm">
                    {e.latestCommission != null ? (
                      <span className="text-success-600">{fmtAmount(e.latestCommission)} {currency.symbol}</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    {e.latestDeduction != null ? (
                      <span className="text-danger-600">{fmtAmount(e.latestDeduction)} {currency.symbol}</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {e.latestSalaryStatus ? (
                      <StatusBadge
                        status={e.latestSalaryStatus}
                        label={getSalaryStatusLabel(e.latestSalaryStatus)}
                      />
                    ) : (
                      <span className="text-xs text-portal-note-text">لم يصدر بعد</span>
                    )}
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </TabsContent>
      </Tabs>

      <Dialog
        open={showRunPayroll}
        onOpenChange={setShowRunPayroll}
        title="تشغيل الرواتب"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton variant="outline" onClick={() => setShowRunPayroll(false)}>
              إلغاء
            </ActionButton>
            <ActionButton onClick={async () => {
              try {
                const result = await runPayroll({ month: payrollMonth, year: payrollYear }).unwrap();
                toast.success(`تم إنشاء ${result.generated} راتب`);
                setShowRunPayroll(false);
              } catch { toast.error("فشل تشغيل الرواتب"); }
            }}>
              تشغيل
            </ActionButton>
            <ActionButton onClick={async () => {
              try {
                const result = await payAll({ month: payrollMonth, year: payrollYear }).unwrap();
                toast.success(`تم دفع ${result.paid} من ${result.total} راتب`);
                setShowRunPayroll(false);
              } catch { toast.error("فشل دفع الرواتب"); }
            }}>
              تشغيل ودفع الكل
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-portal-note-text mb-1">الشهر</label>
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
              >
                {MONTHS_AR.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-portal-note-text mb-1">السنة</label>
              <select
                value={payrollYear}
                onChange={(e) => setPayrollYear(Number(e.target.value))}
                className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          {preview && (
            <div className="rounded-2xl bg-badge-gray-bg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>التكلفة الإجمالية</span>
                <span className="font-medium">{fmtAmount(preview.totalCost)} {currency.symbol}</span>
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
