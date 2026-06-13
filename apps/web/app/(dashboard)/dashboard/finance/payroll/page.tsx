"use client";

import { useState, useMemo } from "react";
import {
  useGetEmployeesQuery,
  useRunPayrollMutation,
  usePaySalaryMutation,
  usePayAllSalariesMutation,
  useDeleteEmployeeMutation,
} from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { PayrollPreviewModal } from "@/components/dashboard/finance/PayrollPreviewModal";
import { EmployeeModal } from "@/components/dashboard/finance/EmployeeModal";
import { DataTable } from "@/components/design-system/DataTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { FormInputControl } from "@/components/design-system/FormInputControl";
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
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
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

  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const [runPayroll, { isLoading: isGenerating }] = useRunPayrollMutation();
  const [paySalary, { isLoading: isPaying }] = usePaySalaryMutation();
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
    const totalCost = rows.reduce(
      (s, r) => s + (r.salary?.amount || 0),
      0,
    );
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

  const handlePay = async (salaryId: string, employeeName: string) => {
    try {
      await paySalary({ id: salaryId }).unwrap();
      toast.success(`تم صرف راتب ${employeeName} بنجاح`);
    } catch {
      toast.error("فشل في صرف الراتب");
    }
  };

  const handlePayAll = async () => {
    try {
      const result = await payAll({ month, year }).unwrap();
      toast.success(`تم صرف ${result.paid} راتب من أصل ${result.total}`);
      setPreviewOpen(false);
    } catch {
      toast.error("فشل في الصرف الجماعي");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من إلغاء تنشيط ${name}؟`)) return;
    try {
      await deleteEmployee(id).unwrap();
      toast.success(`تم إلغاء تنشيط ${name}`);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الرواتب والأجور</h1>
          <p className="text-neutral-400 mt-1">
            إدارة مستحقات الموظفين والبدلات والاستقطاعات.
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton variant="outline" onClick={handleAdd} icon={<Plus className="w-4 h-4" />}>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary-50">
              <Users className="w-4 h-4 text-secondary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">الموظفين</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning-50">
              <Clock className="w-4 h-4 text-warning-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">معلقة للصرف</p>
              <p className="text-xl font-bold text-warning-600">{stats.pending}</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-50">
              <CheckCircle2 className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">تم الصرف</p>
              <p className="text-xl font-bold text-success-600">{stats.paid}</p>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard className="border-none shadow-sm" contentClassName="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary-50">
              <DollarSign className="w-4 h-4 text-secondary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">إجمالي التكلفة</p>
              <p className="text-xl font-bold">{stats.totalCost.toLocaleString()} ر.س</p>
            </div>
          </div>
        </SurfaceCard>
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
              <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                {opt.label}
              </option>
            ))}
          </select>
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <FormInputControl
            placeholder="بحث عن موظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-11"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-natural-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            variant="outline"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => setPreviewOpen(true)}
          >
            معاينة المسير
          </ActionButton>
        </div>
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
          hint: "قم بإضافة موظفين من إعدادات النظام.",
        }}
        renderRow={({ employee, salary }) => {
          const canPay = salary && salary.status === "PENDING";
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
              <td className="px-5 py-4 text-sm text-neutral-500">
                {employee.role}
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600">
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
                {employee.baseSalary.toLocaleString()} ر.س
              </td>
              <td className="px-5 py-4 font-bold">
                {salary ? (
                  <span>{salary.amount.toLocaleString()} ر.س</span>
                ) : (
                  <span className="text-neutral-400 text-sm">—</span>
                )}
              </td>
              <td className="px-5 py-4">
                {salary ? (
                  <FinanceStatusBadge status={salary.status} />
                ) : (
                  <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-500">
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
                      icon={<Wallet className="w-3.5 h-3.5" />}
                      onClick={() => handlePay(salary.id, employee.name)}
                      disabled={isPaying}
                    >
                      صرف
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
                    onClick={() => handleDelete(employee.id, employee.name)}
                    title="إلغاء تنشيط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </ActionButton>
                  <Link href={`/dashboard/finance/payroll/${employee.id}?month=${month}&year=${year}`}>
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
