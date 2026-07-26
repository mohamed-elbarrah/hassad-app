"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useGetEmployeesQuery,
  useRunPayrollMutation,
  usePaySalaryMutation,
  usePayAllSalariesMutation,
  useDeleteEmployeeMutation,
} from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { FinancePageHeader } from "@/components/dashboard/finance/shared/FinancePageHeader";
import { PayrollPreviewModal } from "@/components/dashboard/finance/PayrollPreviewModal";
import { EmployeeModal } from "@/components/dashboard/finance/EmployeeModal";
import { DataTable } from "@/components/design-system/DataTable";
import { MetricCard } from "@/components/design-system/MetricCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import {
  Search,
  Wallet,
  Users,
  Clock,
  CheckCircle2,
  ChevronLeft,
  X,
  Loader2,
  Plus,
  DollarSign,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/design-system/Primitives";

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

function getMonthYearOptions() {
  const opts: { label: string; month: number; year: number }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }
  return opts;
}

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const [runPayroll, { isLoading: isGenerating }] = useRunPayrollMutation();
  const [paySalary] = usePaySalaryMutation();
  const [payAll, { isLoading: isPayingAll }] = usePayAllSalariesMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  const monthOptions = useMemo(() => getMonthYearOptions(), []);

  const rows = useMemo(() => {
    return employees.map((emp) => {
      const salary = (emp as any).salaries?.find(
        (s: any) => s.month === month && s.year === year,
      );
      return { employee: emp, salary };
    });
  }, [employees, month, year]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.employee.name.toLowerCase().includes(q) ||
        r.employee.role?.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const generated = rows.filter((r) => r.salary).length;
    const pending = rows.filter(
      (r) => r.salary && r.salary.status === "PENDING",
    ).length;
    const paid = rows.filter(
      (r) => r.salary && r.salary.status === "PAID",
    ).length;
    const totalCost = rows.reduce((s, r) => s + (r.salary?.amount || 0), 0);
    return { total, generated, pending, paid, totalCost };
  }, [rows]);

  const handleGenerate = async () => {
    try {
      await runPayroll({ month, year }).unwrap();
      toast.success(`تم توليد رواتب ${MONTHS[month - 1]} ${year} بنجاح`);
    } catch {
      toast.error("فشل في توليد الرواتب");
    }
  };

  const handlePay = useCallback(
    async (salaryId: string, employeeName: string) => {
      setPayingId(salaryId);
      try {
        await paySalary({ id: salaryId }).unwrap();
        toast.success(`تم صرف راتب ${employeeName} بنجاح`);
      } catch {
        toast.error("فشل في صرف الراتب");
      } finally {
        setPayingId(null);
      }
    },
    [paySalary],
  );

  const handlePayAll = async () => {
    try {
      const result = await payAll({ month, year }).unwrap();
      toast.success(`تم صرف ${result.paid} راتب من أصل ${result.total}`);
      setPreviewOpen(false);
    } catch {
      toast.error("فشل في الصرف الجماعي");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteEmployee(deleteConfirm.id).unwrap();
      toast.success(`تم إلغاء تنشيط ${deleteConfirm.name}`);
      setDeleteConfirm(null);
    } catch {
      toast.error("فشل في الإلغاء");
    }
  };

  const handleEdit = (emp: any) => {
    setEditingEmployee(emp);
    setEmployeeModalOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setEmployeeModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <FinancePageHeader
        title="الرواتب والأجور"
        description="إدارة مستحقات الموظفين والبدلات والاستقطاعات."
        icon={Wallet}
        actions={
          <div className="flex gap-2">
            <ActionButton
              variant="outline"
              onClick={handleAdd}
              icon={<Plus className="w-4 h-4" />}
            >
              إضافة موظف
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating}
              icon={
                isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )
              }
            >
              توليد الرواتب
            </ActionButton>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="الموظفين"
          value={stats.total}
          icon={Users}
          variant="default"
        />
        <MetricCard
          title="معلقة للصرف"
          value={stats.pending}
          icon={Clock}
          variant={stats.pending > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="تم الصرف"
          value={stats.paid}
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="إجمالي التكلفة"
          value={<CurrencyDisplay amount={stats.totalCost} />}
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative">
          <select
            value={`${month}-${year}`}
            onChange={(e) => {
              const [m, y] = e.target.value.split("-").map(Number);
              setMonth(m);
              setYear(y);
            }}
            className="h-11 pl-10 pr-4 rounded-xl border border-portal-card-border bg-natural-0 text-sm font-medium appearance-none cursor-pointer hover:border-secondary-500/40 transition-colors"
          >
            {monthOptions.map((opt) => (
              <option
                key={`${opt.month}-${opt.year}`}
                value={`${opt.month}-${opt.year}`}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-note-text pointer-events-none" />
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-note-text pointer-events-none" />
          <input
            placeholder="بحث عن موظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pr-10 pl-10 rounded-xl border border-portal-card-border bg-natural-0 text-sm text-natural-100 focus:outline-none focus:ring-2 focus:ring-secondary-500/30 placeholder:text-portal-note-text"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-note-text hover:text-natural-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <ActionButton
          variant="outline"
          size="sm"
          icon={<Eye className="w-4 h-4" />}
          onClick={() => setPreviewOpen(true)}
        >
          معاينة المسير
        </ActionButton>
      </div>

      {/* Table */}
      <DataTable
        columns={[
          { id: "employee", label: "الموظف" },
          { id: "role", label: "المنصب" },
          { id: "payType", label: "نوع الراتب" },
          { id: "base", label: "الأساسي" },
          { id: "amount", label: "المستحق" },
          { id: "status", label: "الحالة" },
          { id: "actions", label: "", align: "left", width: "160px" },
        ]}
        data={filtered}
        isLoading={isLoading}
        isError={false}
        emptyState={{
          icon: Wallet,
          message: "لا يوجد موظفون مسجلون",
          hint: "قم بإضافة موظفين جدد من زر إضافة موظف.",
        }}
        renderRow={({ employee, salary }) => {
          const canPay = salary && salary.status === "PENDING";
          const isPayingThis = payingId === salary?.id;
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
                    <p className="text-xs text-portal-note-text">
                      {employee.role}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {employee.role}
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-badge-gray-bg text-natural-100">
                  {employee.payType === "HYBRID"
                    ? "ثابت + عمولة"
                    : employee.payType === "COMMISSION"
                      ? "عمولة فقط"
                      : employee.payType === "HOURLY"
                        ? "بالساعة"
                        : "ثابت"}
                  {employee.commissionRate && employee.commissionRate > 0 && (
                    <span className="mr-1 text-secondary-500">
                      ({Math.round(employee.commissionRate * 100)}%)
                    </span>
                  )}
                </span>
              </td>
              <td className="px-5 py-4">
                <CurrencyDisplay amount={employee.baseSalary} />
              </td>
              <td className="px-5 py-4 font-bold">
                {salary ? (
                  <CurrencyDisplay amount={salary.amount} />
                ) : (
                  <span className="text-portal-note-text text-sm">—</span>
                )}
              </td>
              <td className="px-5 py-4">
                {salary ? (
                  <FinanceStatusBadge status={salary.status} />
                ) : (
                  <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium bg-badge-gray-bg text-portal-note-text">
                    لم يتم التوليد
                  </span>
                )}
              </td>
              <td className="px-5 py-4 text-left">
                <div className="flex items-center justify-end gap-1">
                  {canPay && (
                    <ActionButton
                      variant="primary"
                      size="sm"
                      icon={
                        isPayingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wallet className="w-3.5 h-3.5" />
                        )
                      }
                      onClick={() => handlePay(salary.id, employee.name)}
                      disabled={isPayingThis}
                    >
                      {isPayingThis ? "..." : "صرف"}
                    </ActionButton>
                  )}
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 hover:bg-secondary-500/10 hover:text-secondary-500"
                    onClick={() => handleEdit(employee)}
                    title="تعديل"
                  >
                    <Pencil className="w-4 h-4" />
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 hover:bg-danger-50 hover:text-danger-500"
                    onClick={() =>
                      setDeleteConfirm({ id: employee.id, name: employee.name })
                    }
                    title="إلغاء تنشيط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </ActionButton>
                  <Link
                    href={`/dashboard/finance/payroll/${employee.id}?month=${month}&year=${year}`}
                  >
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      className="hover:bg-secondary-500/10 hover:text-secondary-500"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </ActionButton>
                  </Link>
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
              تأكيد إلغاء التنشيط
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من إلغاء تنشيط <strong>{deleteConfirm?.name}</strong>
              ؟ لن يتم حذف البيانات بل سيتم تعطيل الحساب.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <ActionButton
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              variant="primary"
              className="bg-danger-500 hover:bg-danger-600"
              onClick={handleDeleteConfirm}
            >
              تأكيد الإلغاء
            </ActionButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <PayrollPreviewModal
        month={month}
        year={year}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onPayAll={handlePayAll}
        isPaying={isPayingAll}
      />

      <EmployeeModal
        open={employeeModalOpen}
        onClose={() => setEmployeeModalOpen(false)}
        employee={editingEmployee}
      />
    </div>
  );
}
