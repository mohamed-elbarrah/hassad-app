"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, Download, ListChecks } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminUsersQuery,
  type AdminUserFilters,
} from "@/features/admin/adminUsersApi";
import { cn } from "@/lib/utils";

const COLUMNS: DataTableColumn[] = [
  { id: "name", label: "الاسم", align: "right" },
  { id: "email", label: "البريد الإلكتروني", align: "right" },
  { id: "role", label: "الدور", align: "right" },
  { id: "department", label: "القسم", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "tasks", label: "المهام النشطة", align: "center" },
  { id: "lastLogin", label: "آخر تسجيل دخول", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: Users,
  message: "لا يوجد موظفون",
  hint: "لم يتم إضافة أي موظفين بعد.",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير نظام",
  PM: "مدير مشروع",
  SALES: "مبيعات",
  TEAM: "فريق",
  MARKETING: "تسويق",
  ACCOUNTANT: "محاسب",
};

const STATUS_OPTIONS = [
  { label: "نشط", value: "true" },
  { label: "موقوف", value: "false" },
];

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export default function AdminEmployeesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const queryParams: AdminUserFilters = useMemo(() => {
    const params: AdminUserFilters = {
      search: search || undefined,
      excludeRole: "CLIENT",
      page,
      limit: 20,
    };
    if (activeFilters["role"]?.length) {
      params.roles = activeFilters["role"].join(",");
    }
    if (activeFilters["status"]?.length) {
      params.status =
        activeFilters["status"][0] === "true" ? "active" : "inactive";
    }
    return params;
  }, [search, page, activeFilters]);

  const { data, isLoading, isError } = useGetAdminUsersQuery(queryParams);

  useEffect(() => {
    setPage(1);
  }, [search, activeFilters]);

  const users = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const active = users.filter((u) => u.isActive).length;
    const suspended = users.filter((u) => !u.isActive).length;
    const roleBreakdown: Record<string, number> = {};
    users.forEach((u) => {
      roleBreakdown[u.role] = (roleBreakdown[u.role] || 0) + 1;
    });
    return { total, active, suspended, roleBreakdown };
  }, [data, users]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الموظفون"
        description="إدارة جميع موظفي المنصة: الأدوار، الأقسام، والصلاحيات"
        icon={Users}
        actions={
          <ActionButton variant="primary" size="md">
            <UserPlus className="h-4 w-4" />
            إضافة موظف
          </ActionButton>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "الإجمالي", value: statCards.total, className: "" },
          {
            label: "نشط",
            value: statCards.active,
            className: "bg-success-100/50 border-success-200 text-success-600",
          },
          {
            label: "موقوف",
            value: statCards.suspended,
            className: "bg-danger-100/50 border-danger-200 text-danger-600",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-[30px] border-[1.5px] border-portal-card-border p-5",
              card.className,
            )}
          >
            <p className="text-sm text-portal-note-text">{card.label}</p>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Role breakdown cards */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div
            key={role}
            className="rounded-[20px] border border-portal-card-border p-3 text-center"
          >
            <p className="text-xs text-portal-note-text">{label}</p>
            <p className="text-lg font-semibold text-natural-100 mt-1">
              {statCards.roleBreakdown[role] || 0}
            </p>
          </div>
        ))}
      </div>

      <SurfaceCard
        title="قائمة الموظفين"
        action={
          <ActionButton variant="outline" size="sm">
            <Download className="h-4 w-4" />
            تصدير CSV
          </ActionButton>
        }
      >
        <div className="mb-4">
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="بحث بالاسم أو البريد الإلكتروني..."
            filterGroups={[
              {
                key: "role",
                label: "الدور",
                options: ROLE_OPTIONS,
              },
              {
                key: "status",
                label: "الحالة",
                options: STATUS_OPTIONS,
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(key, values) =>
              setActiveFilters((prev) => ({ ...prev, [key]: values }))
            }
          />
        </div>

        <DataTable
          columns={COLUMNS}
          data={users}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل الموظفين."
          emptyState={EMPTY_STATE}
          renderRow={(user) => (
            <tr
              key={user.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/employees/${user.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {user.name}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {user.email}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="user" status={user.role} />
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {user.department || "—"}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge
                  domain="client"
                  status={user.isActive ? "ACTIVE" : "STOPPED"}
                />
              </td>
              <td className="py-3 px-2 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <ListChecks className="h-4 w-4 text-portal-note-text" />
                  <span className="text-sm font-medium text-natural-100">
                    {user.activeTasksCount ?? 0}
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString("ar-SA")
                  : "—"}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
