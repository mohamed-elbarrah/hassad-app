"use client";

import { useState } from "react";
import { Kanban, Search, DollarSign, History, CreditCard, TrendingUp } from "lucide-react";
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
import {
  useGetEmployeesQuery,
  useRunPayrollMutation,
  usePayAllSalariesMutation,
  usePaySalaryMutation,
  usePreviewPayrollQuery,
} from "@/features/finance/financeApi";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const PAY_TYPE_MAP: Record<string, string> = {
  MONTHLY: "شهري",
  COMMISSION: "عمولة",
  HOURLY: "ساعي",
};

// Mock salary history for display
const MOCK_SALARY_HISTORY = [
  { month: 6, year: 2026, totalCost: 85000, paidCount: 12, pendingCount: 2 },
  { month: 5, year: 2026, totalCost: 82000, paidCount: 13, pendingCount: 1 },
  { month: 4, year: 2026, totalCost: 80000, paidCount: 14, pendingCount: 0 },
  { month: 3, year: 2026, totalCost: 78000, paidCount: 12, pendingCount: 2 },
  { month: 2, year: 2026, totalCost: 75000, paidCount: 13, pendingCount: 1 },
  { month: 1, year: 2026, totalCost: 72000, paidCount: 14, pendingCount: 0 },
];

export default function AdminPayrollPage() {
  const { fmtAmount, currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("employees");
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());

  const { data: employees, isLoading } = useGetEmployeesQuery();
  const [runPayroll] = useRunPayrollMutation();
  const [payAll] = usePayAllSalariesMutation();
  const [paySalary, { isLoading: payingSalary }] = usePaySalaryMutation();
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

  const handlePayEmployee = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من دفع راتب ${name}؟`)) return;
    try {
      await paySalary({ id }).unwrap();
      toast.success(`تم دفع راتب ${name}`);
    } catch {
      toast.error("فشل دفع الراتب");
    }
  };

  const maxHistoryCost = Math.max(1, ...MOCK_SALARY_HISTORY.map((h) => h.totalCost));

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
                    <Pill tone="neutral">{PAY_TYPE_MAP[e.payType] ?? e.payType}</Pill>
                  </td>
                  <td className="px-5 py-3 text-sm">{fmtAmount(e.baseSalary)} {currency.symbol}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={e.isActive ? "ACTIVE" : "INACTIVE"} label={e.isActive ? "نشط" : "غير نشط"} />
                  </td>
                  <td className="px-5 py-3 text-left">
                    <ActionButton
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePayEmployee(e.id, e.name)}
                      disabled={payingSalary}
                    >
                      <CreditCard className="size-4 ml-1" />
                      دفع الراتب
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
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bar chart comparison */}
          <SurfaceCard>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="size-5 text-secondary-500" />
              <h3 className="font-semibold text-natural-100">مقارنة الرواتب الشهرية</h3>
            </div>
            <div className="flex items-end gap-3 h-44 px-2">
              {MOCK_SALARY_HISTORY.slice(-6).map((h) => {
                const heightPct = (h.totalCost / maxHistoryCost) * 100;
                return (
                  <div key={`${h.month}-${h.year}`} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs text-portal-note-text">
                      {fmtAmount(h.totalCost)} {currency.symbol}
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: h.pendingCount > 0 ? "#f59e0b" : "#22c55e",
                        minHeight: "8px",
                      }}
                    />
                    <span className="text-xs text-portal-note-text">
                      {MONTHS_AR[h.month - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </SurfaceCard>

          {/* History table */}
          <SurfaceCard>
            <h3 className="font-semibold text-natural-100 mb-4">تفاصيل الرواتب السابقة</h3>
            <DataTable
              columns={[
                { id: "month", label: "الشهر" },
                { id: "totalCost", label: "التكلفة الإجمالية" },
                { id: "paidCount", label: "المدفوع" },
                { id: "pendingCount", label: "المعلق" },
                { id: "status", label: "الحالة" },
              ]}
              data={MOCK_SALARY_HISTORY}
              isLoading={false}
              isError={false}
              emptyState={undefined}
              renderRow={(h: any) => (
                <tr key={`${h.month}-${h.year}`} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium">
                    {MONTHS_AR[h.month - 1]} {h.year}
                  </td>
                  <td className="px-5 py-3 text-sm">{fmtAmount(h.totalCost)} {currency.symbol}</td>
                  <td className="px-5 py-3">
                    <Pill tone="success">{h.paidCount}</Pill>
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={h.pendingCount > 0 ? "warning" : "success"}>
                      {h.pendingCount}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={h.pendingCount === 0 ? "ACTIVE" : "PENDING"}
                      label={h.pendingCount === 0 ? "مكتمل" : "معلق"}
                    />
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
                {[2024, 2025, 2026, 2027].map((y) => (
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
