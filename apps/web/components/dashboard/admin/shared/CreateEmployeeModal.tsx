"use client";

import { useState } from "react";
import { Loader2, Shield, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type CreateAdminUserPayload,
  useCreateAdminUserMutation,
} from "@/features/admin/adminUsersApi";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
import { toast } from "sonner";
import { TaskDepartment, UserRole } from "@hassad/shared";

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

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("");
    setDepartment("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password || !role) return;

    const payload: CreateAdminUserPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role: role as UserRole,
      department:
        role === UserRole.TEAM && department
          ? (department as TaskDepartment)
          : undefined,
    };

    try {
      await createUser(payload).unwrap();
      toast.success(adminSuccessMessage("USER_CREATED"));
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen && isLoading) return;
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function preventCloseWhileSubmitting(event: Event) {
    if (isLoading) event.preventDefault();
  }

  function preventEscapeWhileSubmitting(event: KeyboardEvent) {
    if (isLoading) event.preventDefault();
  }

  const isTeamRole = role === UserRole.TEAM;
  const isValid = Boolean(
    name.trim() && email.trim() && password && role && (!isTeamRole || department),
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        dir="rtl"
        showClose={!isLoading}
        onInteractOutside={preventCloseWhileSubmitting}
        onEscapeKeyDown={preventEscapeWhileSubmitting}
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>إضافة موظف جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات الموظف الجديد لإضافته إلى المنصة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User data-icon="inline-start" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="create-employee-name">الاسم *</Label>
                <Input
                  id="create-employee-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="الاسم الكامل"
                  className="min-h-11"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="create-employee-email">البريد الإلكتروني *</Label>
                <Input
                  id="create-employee-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                  className="min-h-11"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="create-employee-password">كلمة المرور *</Label>
                <Input
                  id="create-employee-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8 أحرف على الأقل"
                  className="min-h-11"
                  minLength={8}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield data-icon="inline-start" />
                الصلاحيات والقسم
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="create-employee-role">الدور *</Label>
                <Select
                  value={role}
                  onValueChange={(value) => {
                    setRole(value);
                    if (value !== UserRole.TEAM) setDepartment("");
                  }}
                >
                  <SelectTrigger id="create-employee-role" className="min-h-11" aria-required="true">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {isTeamRole ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-employee-department">القسم *</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger id="create-employee-department" className="min-h-11" aria-required="true">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {DEPT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="min-h-11"
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" className="min-h-11" disabled={!isValid || isLoading}>
              {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {isLoading ? "جارٍ الإضافة..." : "إضافة الموظف"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
