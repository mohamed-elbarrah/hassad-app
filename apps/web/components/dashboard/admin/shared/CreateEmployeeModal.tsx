"use client";

import { useState } from "react";
import { UserPlus, User, Shield } from "lucide-react";
import { Dialog } from "@/components/design-system/Dialog";
import { Input } from "@/components/design-system/Input";
import { Select, SelectItem } from "@/components/design-system/Select";
import { ActionButton } from "@/components/design-system/ActionButton";
import { useCreateAdminUserMutation } from "@/features/admin/adminUsersApi";
import { UserRole, TaskDepartment } from "@hassad/shared";

const ROLE_OPTIONS = [
  { label: "مدير مشروع", value: UserRole.PM },
  { label: "مبيعات", value: UserRole.SALES },
  { label: "فريق", value: UserRole.TEAM },
  { label: "تسويق", value: UserRole.MARKETING },
  { label: "محاسب", value: UserRole.ACCOUNTANT },
];

const DEPT_OPTIONS: { label: string; value: TaskDepartment }[] = [
  { label: "تصميم", value: TaskDepartment.DESIGN },
  { label: "محتوى", value: TaskDepartment.CONTENT },
  { label: "تطوير", value: TaskDepartment.DEVELOPMENT },
  { label: "تسويق", value: TaskDepartment.MARKETING },
  { label: "مونتاج", value: TaskDepartment.PRODUCTION },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEmployeeModal({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [createUser, { isLoading }] = useCreateAdminUserMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !role) return;
    try {
      await createUser({
        name,
        email,
        password,
        role: role as UserRole,
        department:
          role === UserRole.TEAM && department
            ? (department as TaskDepartment)
            : undefined,
      } as any).unwrap();
      resetForm();
      onOpenChange(false);
    } catch {
      /* error handled by RTK */
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("");
    setDepartment("");
  }

  function handleClose(v: boolean) {
    if (!v) resetForm();
    onOpenChange(v);
  }

  const isValid = name && email && password && role;
  const isTeamRole = role === UserRole.TEAM;

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      contentClassName="sm:max-w-[480px]"
    >
      <div className="text-center space-y-1.5 pb-4">
        <div className="flex justify-center mb-3">
          <div className="h-14 w-14 rounded-full bg-secondary-500/10 flex items-center justify-center">
            <UserPlus className="h-7 w-7 text-secondary-500" />
          </div>
        </div>
        <h1 className="text-[22px] font-bold text-natural-100 leading-tight">
          إضافة موظف جديد
        </h1>
        <p className="text-[13px] text-neutral-300 leading-relaxed px-2">
          أدخل بيانات الموظف الجديد لإضافته إلى المنصة
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="border border-neutral-200 rounded-2xl p-5 space-y-4 bg-natural-0">
          <p className="text-[15px] font-bold text-natural-100 flex items-center gap-2">
            <User className="h-4 w-4 text-secondary-500" />
            المعلومات الأساسية
          </p>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-natural-100 block">
              الاسم <span className="text-danger-500">*</span>
            </label>
            <Input
              placeholder="الاسم الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-natural-100 block">
              البريد الإلكتروني <span className="text-danger-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-natural-100 block">
              كلمة المرور <span className="text-danger-500">*</span>
            </label>
            <Input
              type="password"
              placeholder="8 أحرف على الأقل"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
        </div>

        <div className="border border-neutral-200 rounded-2xl p-5 space-y-4 bg-natural-0">
          <p className="text-[15px] font-bold text-natural-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-secondary-500" />
            الصلاحيات والقسم
          </p>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-natural-100 block">
              الدور <span className="text-danger-500">*</span>
            </label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v);
                if (v !== UserRole.TEAM) setDepartment("");
              }}
              placeholder="اختر الدور"
            >
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          {isTeamRole && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-[13px] font-bold text-natural-100 block">
                القسم <span className="text-danger-500">*</span>
              </label>
              <Select
                value={department}
                onValueChange={setDepartment}
                placeholder="اختر القسم"
              >
                {DEPT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <ActionButton
            variant="outline"
            type="button"
            onClick={() => handleClose(false)}
            className="w-[30%] h-14 text-[13px] font-medium"
          >
            إلغاء
          </ActionButton>
          <ActionButton
            type="submit"
            variant="submit"
            size="lg"
            loading={isLoading}
            disabled={!isValid || (isTeamRole && !department)}
            className="flex-1 h-14 text-[15px] font-semibold"
          >
            {isLoading ? "جارٍ الإضافة..." : "إضافة الموظف"}
          </ActionButton>
        </div>
      </form>
    </Dialog>
  );
}
