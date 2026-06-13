"use client";

import { useState } from "react";
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
} from "@/features/finance/financeApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { X, UserPlus, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  employee?: {
    id: string;
    name: string;
    role: string;
    baseSalary: number;
    payType?: string;
    commissionRate?: number | null;
    hourlyRate?: number | null;
  } | null;
}

const PAY_TYPES = [
  { value: "FIXED", label: "راتب ثابت" },
  { value: "HOURLY", label: "أجر بالساعة" },
  { value: "COMMISSION", label: "عمولة فقط" },
  { value: "HYBRID", label: "ثابت + عمولة" },
];

export function EmployeeModal({ open, onClose, employee }: Props) {
  const isEdit = Boolean(employee);
  const [name, setName] = useState(employee?.name || "");
  const [role, setRole] = useState(employee?.role || "");
  const [baseSalary, setBaseSalary] = useState(String(employee?.baseSalary || ""));
  const [payType, setPayType] = useState(employee?.payType || "FIXED");
  const [commissionRate, setCommissionRate] = useState(
    employee?.commissionRate ? String(employee.commissionRate * 100) : "",
  );
  const [hourlyRate, setHourlyRate] = useState(
    employee?.hourlyRate ? String(employee.hourlyRate) : "",
  );

  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim() || !role.trim() || !baseSalary) {
      toast.error("جميع الحقول مطلوبة");
      return;
    }

    const payload = {
      name: name.trim(),
      role: role.trim(),
      baseSalary: Number(baseSalary),
      payType,
      commissionRate: commissionRate ? Number(commissionRate) / 100 : undefined,
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
    };

    try {
      if (isEdit && employee) {
        await updateEmployee({ id: employee.id, ...payload }).unwrap();
        toast.success("تم تحديث بيانات الموظف");
      } else {
        await createEmployee(payload).unwrap();
        toast.success("تم إضافة الموظف بنجاح");
      }
      onClose();
    } catch {
      toast.error("فشل في حفظ البيانات");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <SurfaceCard
          className="w-full max-w-lg pointer-events-auto"
          contentClassName="p-0"
        >
          <div className="px-6 py-4 border-b border-portal-divider flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEdit ? (
                <Pencil className="w-5 h-5 text-secondary-500" />
              ) : (
                <UserPlus className="w-5 h-5 text-secondary-500" />
              )}
              <h2 className="text-lg font-bold">
                {isEdit ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">الاسم</label>
                <FormInputControl
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسم الموظف"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">المنصب</label>
                <FormInputControl
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="مثال: مصمم، مبيعات..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">الراتب الأساسي</label>
                <FormInputControl
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">نوع الراتب</label>
                <select
                  value={payType}
                  onChange={(e) => setPayType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-portal-card-border bg-natural-0 text-sm"
                >
                  {PAY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {(payType === "HYBRID" || payType === "COMMISSION") && (
              <div>
                <label className="text-sm font-medium mb-1 block">نسبة العمولة (%)</label>
                <FormInputControl
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="مثال: 5"
                />
              </div>
            )}

            {payType === "HOURLY" && (
              <div>
                <label className="text-sm font-medium mb-1 block">الأجر بالساعة (ر.س)</label>
                <FormInputControl
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0"
                />
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-portal-divider flex justify-end gap-2">
            <ActionButton variant="outline" onClick={onClose}>إلغاء</ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
            >
              {isEdit ? "حفظ التعديلات" : "إضافة الموظف"}
            </ActionButton>
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}
