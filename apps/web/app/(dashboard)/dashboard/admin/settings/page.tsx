"use client";

import { useState } from "react";
import {
  useSearchUsersQuery,
  useCreateUserMutation,
  useDeactivateUserMutation,
} from "@/features/users/usersApi";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FormSelect,
  FormSelectContent,
  FormSelectItem,
  FormSelectTrigger,
  FormSelectValue,
} from "@/components/design-system/FormSelectControl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pill } from "@/components/design-system/Pill";
import { Skeleton } from "@/components/design-system/Skeleton";
import { UserRole } from "@hassad/shared";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير النظام",
  PM: "مدير مشروع",
  SALES: "مبيعات",
  EMPLOYEE: "موظف",
  MARKETING: "تسويق",
  ACCOUNTANT: "محاسب",
  CLIENT: "عميل",
};

export default function AdminSettingsPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.EMPLOYEE as string,
  });

  const { data, isLoading } = useSearchUsersQuery({
    search: search || undefined,
    limit: 20,
  });
  const [createUser, { isLoading: creating, error: createError }] =
    useCreateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as (typeof UserRole)[keyof typeof UserRole],
      }).unwrap();
      setForm({ name: "", email: "", password: "", role: UserRole.EMPLOYEE });
      setShowForm(false);
    } catch {
      // error shown via createError
    }
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الإعدادات والمستخدمون</h1>
        <p className="text-sm text-neutral-300 mt-1">
          إدارة أعضاء الفريق وأدوارهم.
        </p>
      </div>

      {showForm && (
        <SurfaceCard title="إضافة مستخدم جديد">
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">الاسم</label>
                <FormInputControl
                  placeholder="الاسم الكامل"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">البريد الإلكتروني</label>
                <FormInputControl
                  type="email"
                  placeholder="example@hassad.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">كلمة المرور</label>
                <FormInputControl
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">الدور</label>
                <FormSelect
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                >
                  <FormSelectTrigger>
                    <FormSelectValue placeholder="اختر الدور" />
                  </FormSelectTrigger>
                  <FormSelectContent>
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <FormSelectItem key={val} value={val}>
                        {label}
                      </FormSelectItem>
                    ))}
                  </FormSelectContent>
                </FormSelect>
              </div>
            </div>
            {createError && (
              <p className="text-sm text-danger-500">
                حدث خطأ أثناء إنشاء المستخدم.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <ActionButton
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                إلغاء
              </ActionButton>
              <ActionButton type="submit" disabled={creating}>
                {creating ? "جارٍ الإنشاء..." : "إنشاء المستخدم"}
              </ActionButton>
            </div>
          </form>
        </SurfaceCard>
      )}

      <SurfaceCard
        title="أعضاء الفريق"
        action={
          !showForm && (
            <ActionButton size="sm" onClick={() => setShowForm(true)}>
              + إضافة مستخدم
            </ActionButton>
          )
        }
      >
        <div className="flex flex-col gap-4">
          <FormInputControl
            placeholder="بحث بالاسم أو الإيميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {!isLoading && data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">
                    البريد الإلكتروني
                  </TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-neutral-300 py-8"
                    >
                      لا يوجد مستخدمون.
                    </TableCell>
                  </TableRow>
                )}
                {data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell dir="ltr">{u.email}</TableCell>
                    <TableCell>
                      <Pill tone="neutral">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Pill>
                    </TableCell>
                    <TableCell>
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        className="text-danger-500 hover:text-danger-500"
                        onClick={() => deactivateUser(u.id)}
                      >
                        تعطيل
                      </ActionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
