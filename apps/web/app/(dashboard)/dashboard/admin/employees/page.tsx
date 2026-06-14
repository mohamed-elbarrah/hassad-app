"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Plus, Pencil, PowerOff, Power, Users } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pill } from "@/components/design-system/Pill";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
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

const ROLE_PILL_TONE: Record<UserRole, "danger" | "neutral" | "warning" | "success" | "blue"> = {
  [UserRole.ADMIN]: "danger",
  [UserRole.PM]: "neutral",
  [UserRole.SALES]: "warning",
  [UserRole.EMPLOYEE]: "neutral",
  [UserRole.MARKETING]: "warning",
  [UserRole.ACCOUNTANT]: "warning",
  [UserRole.CLIENT]: "neutral",
};

const STAFF_ROLES: UserRole[] = [
  UserRole.SALES, UserRole.PM, UserRole.EMPLOYEE,
  UserRole.MARKETING, UserRole.ACCOUNTANT, UserRole.ADMIN,
];

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function EmployeesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<UserDetail | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const roleFilter = activeFilters["role"]?.[0] as UserRole | undefined;
  const deptFilter = activeFilters["department"]?.[0] as TaskDepartment | undefined;
  const showDeptGroup = roleFilter === UserRole.EMPLOYEE;

  const filters: UserSearchFilters = {
    search: debouncedSearch || undefined,
    role: roleFilter,
    excludeRole: UserRole.CLIENT,
    department: showDeptGroup ? deptFilter : undefined,
    limit: 50,
  };

  const { data, isLoading, isError } = useSearchUsersQuery(filters);
  const [deactivateUser, { isLoading: isDeactivating }] = useDeactivateUserMutation();
  const [reactivateUser, { isLoading: isReactivating }] = useReactivateUserMutation();
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

  const handleFilterChange = useCallback((groupKey: string, values: string[]) => {
    if (groupKey === "role") {
      const newRole = values.length > 0 ? values[values.length - 1] : undefined;
      setActiveFilters((prev) => {
        const next: Record<string, string[]> = { ...prev, [groupKey]: values.length > 0 ? [newRole as string] : [] };
        if (newRole !== UserRole.EMPLOYEE && next["department"]) delete next["department"];
        return next;
      });
    } else {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
    }
  }, []);

  const filterGroups: FilterGroup[] = [
    {
      key: "role",
      label: "الدور",
      options: STAFF_ROLES.map((role) => ({ label: ROLE_LABELS[role], value: role })),
    },
  ];
  if (showDeptGroup) {
    filterGroups.push({
      key: "department",
      label: "القسم",
      options: Object.values(TaskDepartment).map((dept) => ({ label: DEPARTMENT_LABELS[dept], value: dept })),
    });
  }

  const employees = (data?.items ?? []) as UserDetail[];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إدارة الموظفين"
        description={`إجمالي ${data?.total ?? 0} موظف`}
        icon={Users}
        actions={
          <ActionButton onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-1" />
            موظف جديد
          </ActionButton>
        }
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث عن موظف..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <FilterBar groups={filterGroups} activeFilters={activeFilters} onFilterChange={handleFilterChange} />
      </div>

      {/* Active filter pills */}
      {(roleFilter || deptFilter) && (
        <div className="flex flex-wrap gap-2">
          {roleFilter && <Pill tone="blue">{ROLE_LABELS[roleFilter]}</Pill>}
          {deptFilter && <Pill tone="blue">{DEPARTMENT_LABELS[deptFilter]}</Pill>}
        </div>
      )}

      <DataTable
        columns={[
          { id: "name", label: "الاسم" },
          { id: "email", label: "البريد الإلكتروني" },
          { id: "role", label: "الدور" },
          { id: "department", label: "القسم" },
          { id: "requests", label: "طلبات نشطة" },
          { id: "projects", label: "مشاريع نشطة" },
          { id: "status", label: "الحالة" },
          { id: "actions", label: "الإجراءات", width: "100px" },
        ]}
        data={employees}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل الموظفين. يرجى تحديث الصفحة."
        emptyState={{
          icon: Users,
          message: "لا يوجد موظفون",
          hint: "ابدأ بإضافة موظف جديد",
        }}
        renderRow={(emp) => (
          <tr key={emp.id} className="border-b-[1.5px] border-portal-divider">
            <td className="px-5 py-4 text-base font-medium text-natural-100">{emp.name}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text">{emp.email}</td>
            <td className="px-5 py-4">
              <Pill tone={ROLE_PILL_TONE[emp.role]}>{ROLE_LABELS[emp.role]}</Pill>
            </td>
            <td className="px-5 py-4">
              {emp.department ? (
                <Pill tone="neutral">{DEPARTMENT_LABELS[emp.department]}</Pill>
              ) : (
                <span className="text-sm text-portal-note-text">—</span>
              )}
            </td>
            <td className="px-5 py-4">
              {typeof emp.activeRequestsCount === "number" && emp.activeRequestsCount > 0 ? (
                <Pill tone={emp.activeRequestsCount >= 5 ? "danger" : emp.activeRequestsCount >= 3 ? "warning" : "success"}>
                  {emp.activeRequestsCount}
                </Pill>
              ) : (
                <span className="text-sm text-portal-note-text">—</span>
              )}
            </td>
            <td className="px-5 py-4">
              {typeof emp.activeProjectsCount === "number" && emp.activeProjectsCount > 0 ? (
                <Pill tone={emp.activeProjectsCount >= 5 ? "danger" : emp.activeProjectsCount >= 3 ? "warning" : "success"}>
                  {emp.activeProjectsCount}
                </Pill>
              ) : (
                <span className="text-sm text-portal-note-text">—</span>
              )}
            </td>
            <td className="px-5 py-4">
              <StatusBadge status={emp.isActive ? "ACTIVE" : "STOPPED"} label={emp.isActive ? "نشط" : "غير نشط"} />
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-1">
                <ActionButton variant="ghost" size="sm" className="h-8 w-8" onClick={() => setEditEmployee(emp)} aria-label="تعديل">
                  <Pencil className="size-3.5" />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 ${emp.isActive ? "text-danger-500 hover:text-danger-500" : "text-success-600 hover:text-success-600"}`}
                  disabled={isToggling}
                  onClick={() => handleToggleActive(emp.id, emp.isActive)}
                  aria-label={emp.isActive ? "تعطيل" : "تفعيل"}
                >
                  {emp.isActive ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
                </ActionButton>
              </div>
            </td>
          </tr>
        )}
      />

      {createOpen && <EmployeeForm mode="create" onClose={() => setCreateOpen(false)} />}
      {editEmployee && <EmployeeForm mode="edit" employee={editEmployee} onClose={() => setEditEmployee(null)} />}
    </div>
  );
}
