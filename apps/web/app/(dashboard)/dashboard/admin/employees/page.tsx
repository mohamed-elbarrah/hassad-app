"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Plus, Pencil, PowerOff, Power } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pill } from "@/components/design-system/Pill";
import { Skeleton } from "@/components/design-system/Skeleton";
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
  useReactivateUserMutation,
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
  [TaskDepartment.PRODUCTION]: "مونتاج",
};

const ROLE_PILL_TONE: Record<
  UserRole,
  "danger" | "neutral" | "warning" | "success" | "blue"
> = {
  [UserRole.ADMIN]: "danger",
  [UserRole.PM]: "neutral",
  [UserRole.SALES]: "warning",
  [UserRole.EMPLOYEE]: "neutral",
  [UserRole.MARKETING]: "warning",
  [UserRole.ACCOUNTANT]: "warning",
  [UserRole.CLIENT]: "neutral",
};

const STAFF_ROLES: UserRole[] = [
  UserRole.SALES,
  UserRole.PM,
  UserRole.EMPLOYEE,
  UserRole.MARKETING,
  UserRole.ACCOUNTANT,
  UserRole.ADMIN,
];

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
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<UserDetail | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  // Extract single-select values from FilterBar multi-select state
  const roleFilter = activeFilters["role"]?.[0] as UserRole | undefined;
  const deptFilter = activeFilters["department"]?.[0] as TaskDepartment | undefined;

  // Department filter ONLY visible when EMPLOYEE is explicitly selected
  const showDeptGroup = roleFilter === UserRole.EMPLOYEE;

  const filters: UserSearchFilters = {
    search: debouncedSearch || undefined,
    role: roleFilter,
    excludeRole: UserRole.CLIENT, // Never show clients on employees page
    department: showDeptGroup ? deptFilter : undefined,
    limit: 50,
  };

  const { data, isLoading, isError } = useSearchUsersQuery(filters);

  const [deactivateUser, { isLoading: isDeactivating }] =
    useDeactivateUserMutation();
  const [reactivateUser, { isLoading: isReactivating }] =
    useReactivateUserMutation();
  const isToggling = isDeactivating || isReactivating;

  async function handleToggleActive(id: string, currentlyActive: boolean) {
    try {
      if (currentlyActive) {
        await deactivateUser(id).unwrap();
        toast.success("تم تعطيل الموظف.");
      } else {
        await reactivateUser(id).unwrap();
        toast.success("تم تفعيل الموظف.");
      }
    } catch {
      toast.error("فشلت العملية. يرجى المحاولة مجدداً.");
    }
  }

  // Enforce single selection for roles (radio-like). Auto-clear dept when role != EMPLOYEE.
  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      if (groupKey === "role") {
        const newRole = values.length > 0 ? values[values.length - 1] : undefined;
        setActiveFilters((prev) => {
          const next: Record<string, string[]> = {
            ...prev,
            [groupKey]: values.length > 0 ? [newRole as string] : [],
          };
          // Clear department if new role is not EMPLOYEE
          if (newRole !== UserRole.EMPLOYEE && next["department"]) {
            delete next["department"];
          }
          return next;
        });
      } else {
        setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
      }
    },
    [],
  );

  // Build filter groups dynamically
  const filterGroups: FilterGroup[] = [
    {
      key: "role",
      label: "الدور",
      options: STAFF_ROLES.map((role) => ({
        label: ROLE_LABELS[role],
        value: role,
      })),
    },
  ];

  if (showDeptGroup) {
    filterGroups.push({
      key: "department",
      label: "القسم",
      options: Object.values(TaskDepartment).map((dept) => ({
        label: DEPARTMENT_LABELS[dept],
        value: dept,
      })),
    });
  }

  const employees = (data?.items ?? []) as UserDetail[];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">إدارة الموظفين</h1>
        <ActionButton onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1" />
          موظف جديد
        </ActionButton>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-300" />
          <FormInputControl
            placeholder="ابحث عن موظف..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <FilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Active filter pills */}
      {(roleFilter || deptFilter) && (
        <div className="flex flex-wrap gap-2">
          {roleFilter && (
            <Pill tone="blue" className="text-xs">
              {ROLE_LABELS[roleFilter]}
            </Pill>
          )}
          {deptFilter && (
            <Pill tone="blue" className="text-xs">
              {DEPARTMENT_LABELS[deptFilter]}
            </Pill>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-neutral-50/50 px-4 py-3 flex gap-6">
            {Array.from({ length: 7 }).map((_, i) => (
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
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-danger-500 text-sm">
          حدث خطأ أثناء تحميل الموظفين. يرجى تحديث الصفحة.
        </p>
      )}

      {!isLoading && !isError && data && (
        <>
          {employees.length === 0 ? (
            <div className="text-center py-16 text-neutral-300">
              <p className="text-lg font-medium">لا يوجد موظفون</p>
              <p className="text-sm mt-1">ابدأ بإضافة موظف جديد</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50/50">
                    <TableHead className="text-right font-semibold">الاسم</TableHead>
                    <TableHead className="text-right font-semibold">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right font-semibold">الدور</TableHead>
                    <TableHead className="text-right font-semibold">القسم</TableHead>
                    <TableHead className="text-right font-semibold">طلبات نشطة</TableHead>
                    <TableHead className="text-right font-semibold">مشاريع نشطة</TableHead>
                    <TableHead className="text-right font-semibold">الحالة</TableHead>
                    <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-neutral-50/50">
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-neutral-300 text-sm">{emp.email}</TableCell>
                      <TableCell>
                        <Pill tone={ROLE_PILL_TONE[emp.role]}>
                          {ROLE_LABELS[emp.role]}
                        </Pill>
                      </TableCell>
                      <TableCell>
                        {emp.department ? (
                          <Pill tone="neutral">{DEPARTMENT_LABELS[emp.department]}</Pill>
                        ) : (
                          <span className="text-xs text-neutral-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {typeof emp.activeRequestsCount === "number" &&
                        emp.activeRequestsCount > 0 ? (
                          <Pill
                            tone={
                              emp.activeRequestsCount >= 5
                                ? "danger"
                                : emp.activeRequestsCount >= 3
                                  ? "warning"
                                  : "success"
                            }
                          >
                            {emp.activeRequestsCount}
                          </Pill>
                        ) : (
                          <span className="text-xs text-neutral-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {typeof emp.activeProjectsCount === "number" &&
                        emp.activeProjectsCount > 0 ? (
                          <Pill
                            tone={
                              emp.activeProjectsCount >= 5
                                ? "danger"
                                : emp.activeProjectsCount >= 3
                                  ? "warning"
                                  : "success"
                            }
                          >
                            {emp.activeProjectsCount}
                          </Pill>
                        ) : (
                          <span className="text-xs text-neutral-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Pill tone={emp.isActive ? "success" : "danger"}>
                          {emp.isActive ? "نشط" : "غير نشط"}
                        </Pill>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            className="size-8"
                            onClick={() => setEditEmployee(emp)}
                            aria-label="تعديل"
                          >
                            <Pencil className="size-3.5" />
                          </ActionButton>
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            className={`size-8 ${
                              emp.isActive
                                ? "text-danger-500 hover:text-danger-500"
                                : "text-success-600 hover:text-success-600"
                            }`}
                            disabled={isToggling}
                            onClick={() => handleToggleActive(emp.id, emp.isActive)}
                            aria-label={emp.isActive ? "تعطيل" : "تفعيل"}
                          >
                            {emp.isActive ? (
                              <PowerOff className="size-3.5" />
                            ) : (
                              <Power className="size-3.5" />
                            )}
                          </ActionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-neutral-300">
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
