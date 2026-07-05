"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useGetEmployeeByIdQuery,
  usePaySalaryMutation,
  useUpdateSalaryMutation,
} from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { FinanceDetailBreadcrumb } from "@/components/dashboard/finance/shared/FinanceDetailBreadcrumb";
import { FinanceDetailSkeleton } from "@/components/dashboard/finance/shared/FinanceDetailSkeleton";
import { FinanceDetailError } from "@/components/dashboard/finance/shared/FinanceDetailError";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { DataTable } from "@/components/design-system/DataTable";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import {
  Wallet,
  History,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Calendar,
  Hash,
  Pencil,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const MONTHS = [
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

  const [showAllowancesModal, setShowAllowancesModal] = useState(false);
  const [showPayConfirm, setShowPayConfirm] = useState(false);

  const {
    data: employee,
    isLoading,
    isError,
  } = useGetEmployeeByIdQuery(employeeId);
  const [paySalary, { isLoading: isPaying }] = usePaySalaryMutation();
  const [updateSalary, { isLoading: isUpdating }] = useUpdateSalaryMutation();

  if (isLoading) {
    return <FinanceDetailSkeleton />;
  }

  if (isError || !employee) {
    return (
      <FinanceDetailError
        title="الموظف غير موجود"
        backHref="/dashboard/finance/payroll"
        backLabel="الرواتب"
      />
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
      setShowPayConfirm(false);
    } catch {
      toast.error("فشل في صرف الراتب");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <FinanceDetailBreadcrumb
          items={[
            { label: "المالية", href: "/dashboard/finance" },
            { label: "الرواتب", href: "/dashboard/finance/payroll" },
            { label: employee.name },
          ]}
        />

        <div className="flex items-center gap-2">
          <ActionButton
            variant="outline"
            size="sm"
            icon={<FileText className="w-4 h-4" />}
          >
            تصدير مسير الرواتب
          </ActionButton>
          {salary?.status === "PENDING" && (
            <ActionButton
              variant="primary"
              size="sm"
              icon={<Wallet className="w-4 h-4" />}
              onClick={() => setShowPayConfirm(true)}
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
                  <FinanceStatusBadge
                    status={employee.isActive ? "ACTIVE" : "CANCELLED"}
                  />
                </div>
                <p className="text-portal-note-text">{employee.role}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                  <span className="bg-badge-gray-bg px-3 py-1 rounded-lg text-xs font-mono">
                    <Hash className="w-3 h-3 inline ml-1" />
                    {employee.id.substring(0, 8)}...
                  </span>
                  <span className="bg-badge-gray-bg px-3 py-1 rounded-lg text-xs">
                    الراتب الأساسي:{" "}
                    <CurrencyDisplay amount={employee.baseSalary} />
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
                    <option
                      key={i}
                      value={`${d.getMonth() + 1}-${d.getFullYear()}`}
                    >
                      {MONTHS[d.getMonth()]} {d.getFullYear()}
                    </option>
                  );
                })}
              </select>
            }
          >
            {!salary ? (
              <div className="text-center py-8">
                <p className="text-portal-note-text">
                  لم يتم توليد راتب لهذا الشهر
                </p>
                <ActionButton
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  href="/dashboard/finance/payroll"
                >
                  الذهاب لتوليد الراتب
                </ActionButton>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4 text-center">
                    <p className="text-xs text-portal-note-text mb-1">
                      الأساسي
                    </p>
                    <p className="text-lg font-bold text-natural-100">
                      <CurrencyDisplay amount={salary.baseSalary} />
                    </p>
                  </div>
                  <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4 text-center">
                    <p className="text-xs text-success-600 mb-1 flex items-center justify-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      البدلات
                    </p>
                    <p className="text-lg font-bold text-success-600">
                      <CurrencyDisplay amount={salary.bonuses || 0} />
                    </p>
                  </div>
                  <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4 text-center">
                    <p className="text-xs text-danger-600 mb-1 flex items-center justify-center gap-1">
                      <ArrowDown className="w-3 h-3" />
                      الاستقطاعات
                    </p>
                    <p className="text-lg font-bold text-danger-600">
                      <CurrencyDisplay amount={salary.deductions || 0} />
                    </p>
                  </div>
                  <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4 text-center">
                    <p className="text-xs text-secondary-600 mb-1">الصافي</p>
                    <p className="text-lg font-bold text-secondary-600">
                      <CurrencyDisplay amount={salary.amount} />
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <FinanceStatusBadge
                      status={salary.status}
                      className="text-base px-3 py-1"
                    />
                    {salary.paymentDate && (
                      <span className="text-sm text-portal-note-text">
                        تاريخ الصرف:{" "}
                        {new Date(salary.paymentDate).toLocaleDateString(
                          "ar-SA-u-nu-latn",
                        )}
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
                          onClick={() => setShowAllowancesModal(true)}
                          disabled={isUpdating}
                        >
                          تعديل البدلات
                        </ActionButton>
                        <ActionButton
                          variant="primary"
                          size="sm"
                          icon={<Wallet className="w-4 h-4" />}
                          onClick={() => setShowPayConfirm(true)}
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
                  <td className="px-5 py-4">
                    <CurrencyDisplay amount={s.baseSalary} />
                  </td>
                  <td className="px-5 py-4 text-success-600">
                    +<CurrencyDisplay amount={s.bonuses || 0} />
                  </td>
                  <td className="px-5 py-4 text-danger-600">
                    -<CurrencyDisplay amount={s.deductions || 0} />
                  </td>
                  <td className="px-5 py-4 font-bold">
                    <CurrencyDisplay amount={s.amount} />
                  </td>
                  <td className="px-5 py-4">
                    <FinanceStatusBadge status={s.status} />
                  </td>
                  <td className="px-5 py-4 text-left text-xs text-portal-note-text">
                    {s.paymentDate
                      ? new Date(s.paymentDate).toLocaleDateString(
                          "ar-SA-u-nu-latn",
                        )
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
                <span className="text-sm text-portal-note-text">
                  نوع الراتب
                </span>
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
                <span className="text-sm text-portal-note-text">
                  الراتب الأساسي
                </span>
                <span className="text-sm font-bold">
                  <CurrencyDisplay amount={employee.baseSalary} />
                </span>
              </div>
              {employee.commissionRate && employee.commissionRate > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-portal-note-text">
                    نسبة العمولة
                  </span>
                  <span className="text-sm font-bold text-secondary-600">
                    {Math.round(employee.commissionRate * 100)}%
                  </span>
                </div>
              )}
              {employee.hourlyRate && employee.hourlyRate > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-portal-note-text">
                    الأجر بالساعة
                  </span>
                  <span className="text-sm font-bold">
                    <CurrencyDisplay amount={employee.hourlyRate} />
                  </span>
                </div>
              )}
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
                  onClick={() => setShowPayConfirm(true)}
                  disabled={isPaying}
                >
                  {isPaying ? "جاري الصرف..." : "صرف الراتب الحالي"}
                </ActionButton>
              ) : salary?.status === "PAID" ? (
                <div className="text-center py-3">
                  <CheckCircle2 className="w-10 h-10 text-success-500 mx-auto mb-2" />
                  <p className="text-success-600 font-bold">تم الصرف</p>
                  <p className="text-xs text-portal-note-text mt-1">
                    {salary.paymentDate
                      ? new Date(salary.paymentDate).toLocaleDateString(
                          "ar-SA-u-nu-latn",
                        )
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
                  onClick={() => setShowAllowancesModal(true)}
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

          {salary?.notes && (
            <SurfaceCard className="border-none shadow-sm">
              <div className="p-4">
                <p className="text-sm text-portal-note-text">{salary.notes}</p>
              </div>
            </SurfaceCard>
          )}
        </div>
      </div>

      {/* Pay Confirmation Dialog */}
      <Dialog open={showPayConfirm} onOpenChange={setShowPayConfirm}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد صرف الراتب</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من صرف راتب <strong>{employee.name}</strong>؟
              {salary && (
                <div className="mt-2 p-3 rounded-lg bg-badge-gray-bg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>المبلغ:</span>
                    <span className="font-bold">
                      <CurrencyDisplay amount={salary.amount} />
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>الشهر:</span>
                    <span>
                      {MONTHS[salary.month - 1]} {salary.year}
                    </span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <ActionButton
              variant="outline"
              onClick={() => setShowPayConfirm(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handlePay}
              loading={isPaying}
            >
              تأكيد الصرف
            </ActionButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allowances Modal */}
      <AllowancesModal
        open={showAllowancesModal}
        onOpenChange={setShowAllowancesModal}
        salary={salary}
        employeeName={employee.name}
        onUpdate={updateSalary}
        isUpdating={isUpdating}
      />
    </div>
  );
}

// ── Allowances Modal Component ──────────────────────────────────────────────

function AllowancesModal({
  open,
  onOpenChange,
  salary,
  employeeName,
  onUpdate,
  isUpdating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salary: any;
  employeeName: string;
  onUpdate: any;
  isUpdating: boolean;
}) {
  const [bonuses, setBonuses] = useState(String(salary?.bonuses || 0));
  const [deductions, setDeductions] = useState(String(salary?.deductions || 0));

  const handleSave = async () => {
    const b = Number(bonuses);
    const d = Number(deductions);
    if (isNaN(b) || isNaN(d)) {
      toast.error("يرجى إدخال أرقام صحيحة");
      return;
    }
    try {
      await onUpdate({ id: salary.id, bonuses: b, deductions: d }).unwrap();
      toast.success(`تم تحديث البدلات والاستقطاعات لـ ${employeeName}`);
      onOpenChange(false);
    } catch {
      toast.error("فشل في التحديث");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل البدلات والاستقطاعات</DialogTitle>
          <DialogDescription>
            تعديل بدلات وحوافز واستقطاعات {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1 block text-success-600">
              البدلات والحوافز
            </label>
            <input
              type="number"
              value={bonuses}
              onChange={(e) => setBonuses(e.target.value)}
              className="w-full rounded-xl border border-portal-card-border bg-natural-0 px-4 py-2.5 text-sm text-natural-100 focus:outline-none focus:ring-2 focus:ring-secondary-500/30"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-danger-600">
              الاستقطاعات
            </label>
            <input
              type="number"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
              className="w-full rounded-xl border border-portal-card-border bg-natural-0 px-4 py-2.5 text-sm text-natural-100 focus:outline-none focus:ring-2 focus:ring-secondary-500/30"
              placeholder="0"
            />
          </div>
          {salary && (
            <div className="p-3 rounded-lg bg-badge-gray-bg text-sm space-y-1">
              <div className="flex justify-between">
                <span>الأساسي</span>
                <span>
                  <CurrencyDisplay amount={salary.baseSalary} />
                </span>
              </div>
              <div className="flex justify-between text-success-600">
                <span>+ البدلات</span>
                <span>
                  +<CurrencyDisplay amount={Number(bonuses) || 0} />
                </span>
              </div>
              <div className="flex justify-between text-danger-600">
                <span>- الاستقطاعات</span>
                <span>
                  -<CurrencyDisplay amount={Number(deductions) || 0} />
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-portal-divider">
                <span>الصافي المتوقع</span>
                <span>
                  <CurrencyDisplay
                    amount={
                      salary.baseSalary +
                      (Number(bonuses) || 0) -
                      (Number(deductions) || 0)
                    }
                  />
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <ActionButton variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={handleSave}
            loading={isUpdating}
          >
            حفظ التعديلات
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
