"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Pencil, PowerOff, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  useSearchUsersQuery,
  useDeactivateUserMutation,
  type UserDetail,
  type UserSearchFilters,
} from "@/features/users/usersApi";
import { EmployeeForm } from "@/components/dashboard/admin/EmployeeForm";
import { UserRole, TaskDepartment } from "@hassad/shared";

// ── Labels ────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "مدير النظام",
  [UserRole.PM]: "مدير مشروع",
  [UserRole.SALES]: "مبيعات",
  [UserRole.EMPLOYEE]: "موظف",
  [UserRole.MARKETING]: "تسويق",
  [UserRole.ACCOUNTANT]: "محاسب",
  [UserRole.CLIENT]: "عميل",
};

const DEPARTMENT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "تصميم",
  [TaskDepartment.MARKETING]: "تسويق",
  [TaskDepartment.DEVELOPMENT]: "تطوير",
  [TaskDepartment.CONTENT]: "محتوى",
  [TaskDepartment.MANAGEMENT]: "إدارة",
};

const ROLE_BADGE_VARIANTS: Record<
  UserRole,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [UserRole.ADMIN]: "destructive",
  [UserRole.PM]: "default",
  [UserRole.SALES]: "secondary",
  [UserRole.EMPLOYEE]: "outline",
  [UserRole.MARKETING]: "secondary",
  [UserRole.ACCOUNTANT]: "secondary",
  [UserRole.CLIENT]: "outline",
};

// ── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [deptFilter, setDeptFilter] = useState<TaskDepartment | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<UserDetail | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const filters: UserSearchFilters = {
    search: debouncedSearch || undefined,
    department: deptFilter === "all" ? undefined : deptFilter,
  };

  const { data, isLoading, isError } = useSearchUsersQuery(filters);

  const [deactivateUser, { isLoading: isDeactivating }] =
    useDeactivateUserMutation();

  async function handleToggleActive(id: string, currentlyActive: boolean) {
    try {
      await deactivateUser(id).unwrap();
      toast.success(currentlyActive ? "تم تعطيل الموظف." : "تم تفعيل الموظف.");
    } catch {
      toast.error("فشلت العملية. يرجى المحاولة مجدداً.");
    }
  }

  // The API returns UserSearchResult (no isActive/department), so we cast here.
  // The backend GET /users endpoint returns full detail — we rely on the
  // UserDetail type for the edit flow via invalidation + re-fetch.
  const employees = (data?.items ?? []) as unknown as UserDetail[];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">إدارة الموظفين</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1" />
          موظف جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن موظف..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select
          value={deptFilter}
          onValueChange={(v) => setDeptFilter(v as TaskDepartment | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="كل الأقسام" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأقسام</SelectItem>
            {Object.values(TaskDepartment).map((dept) => (
              <SelectItem key={dept} value={dept}>
                {DEPARTMENT_LABELS[dept]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 flex gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-6 px-4 py-3 border-t">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm">
          حدث خطأ أثناء تحميل الموظفين. يرجى تحديث الصفحة.
        </p>
      )}

      {!isLoading && !isError && data && (
        <>
          {employees.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">لا يوجد موظفون</p>
              <p className="text-sm mt-1">ابدأ بإضافة موظف جديد</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-semibold">
                      الاسم
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      البريد الإلكتروني
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الدور
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      القسم
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الحالة
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {emp.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_BADGE_VARIANTS[emp.role]}>
                          {ROLE_LABELS[emp.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {emp.department ? (
                          <Badge variant="outline">
                            {DEPARTMENT_LABELS[emp.department]}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={emp.isActive ? "default" : "destructive"}
                          className={
                            emp.isActive
                              ? "bg-green-600 hover:bg-green-700"
                              : undefined
                          }
                        >
                          {emp.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setEditEmployee(emp)}
                            aria-label="تعديل"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`size-8 ${emp.isActive ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600"}`}
                            disabled={isDeactivating}
                            onClick={() =>
                              handleToggleActive(emp.id, emp.isActive)
                            }
                            aria-label={emp.isActive ? "تعطيل" : "تفعيل"}
                          >
                            {emp.isActive ? (
                              <PowerOff className="size-3.5" />
                            ) : (
                              <Power className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            إجمالي {data.total} موظف
          </p>
        </>
      )}

      {/* Create dialog */}
      {createOpen && (
        <EmployeeForm mode="create" onClose={() => setCreateOpen(false)} />
      )}

      {/* Edit dialog */}
      {editEmployee && (
        <EmployeeForm
          mode="edit"
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
        />
      )}
    </div>
  );
}
