"use client";

import { useState } from "react";
import {
  useSearchUsersQuery,
  useCreateUserMutation,
  useDeactivateUserMutation,
} from "@/features/users/usersApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

  const { data, isLoading } = useSearchUsersQuery({ search: search || undefined, limit: 20 });
  const [createUser, { isLoading: creating, error: createError }] = useCreateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as typeof UserRole[keyof typeof UserRole],
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
        <p className="text-sm text-muted-foreground mt-1">
          إدارة أعضاء الفريق وأدوارهم.
        </p>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">إضافة مستخدم جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">الاسم</label>
                  <Input
                    placeholder="الاسم الكامل"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    placeholder="example@hassad.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">كلمة المرور</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">الدور</label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {createError && (
                <p className="text-sm text-destructive">
                  حدث خطأ أثناء إنشاء المستخدم.
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "جارٍ الإنشاء..." : "إنشاء المستخدم"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">أعضاء الفريق</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              + إضافة مستخدم
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
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
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      لا يوجد مستخدمون.
                    </TableCell>
                  </TableRow>
                )}
                {data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell dir="ltr">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deactivateUser(u.id)}
                      >
                        تعطيل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
