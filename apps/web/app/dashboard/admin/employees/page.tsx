"use client";

import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
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
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
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
            <div className="flex flex-col gap-3">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-card p-4"
                >
                  {/* Info */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-base truncate">
                        {emp.name}
                      </span>
                      <Badge variant={ROLE_BADGE_VARIANTS[emp.role]}>
                        {ROLE_LABELS[emp.role]}
                      </Badge>
                      {emp.department && (
                        <Badge variant="outline">
                          {DEPARTMENT_LABELS[emp.department]}
                        </Badge>
                      )}
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
                    </div>
                    <span className="text-sm text-muted-foreground truncate">
                      {emp.email}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditEmployee(emp)}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant={emp.isActive ? "destructive" : "default"}
                      size="sm"
                      disabled={isDeactivating}
                      onClick={() => handleToggleActive(emp.id, emp.isActive)}
                    >
                      {emp.isActive ? "تعطيل" : "تفعيل"}
                    </Button>
                  </div>
                </div>
              ))}
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
