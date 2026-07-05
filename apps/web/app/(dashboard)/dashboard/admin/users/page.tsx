"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  Users,
  Power,
  PowerOff,
  Download,
  KeyRound,
  UserCheck,
  Monitor,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pill } from "@/components/design-system/Pill";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { toast } from "sonner";
import {
  useSearchAdminUsersQuery,
  useBulkUserActionMutation,
  useResetUserPasswordMutation,
  useImpersonateUserMutation,
  useRevokeUserSessionsMutation,
  type AdminUserDetail,
  type AdminUserFilters,
} from "@/features/admin/adminApi";
import {
  BulkActionBar,
  type BulkAction,
} from "@/components/dashboard/admin/BulkActionBar";
import { ImpersonateDialog } from "@/components/dashboard/admin/ImpersonateDialog";
import { ResetPasswordDialog } from "@/components/dashboard/admin/ResetPasswordDialog";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير النظام",
  PM: "مدير مشروع",
  SALES: "مبيعات",
  EMPLOYEE: "موظف",
  MARKETING: "تسويق",
  ACCOUNTANT: "محاسب",
  CLIENT: "عميل",
};

const ROLE_PILL_TONE: Record<
  string,
  "danger" | "neutral" | "warning" | "success" | "blue"
> = {
  ADMIN: "danger",
  PM: "neutral",
  SALES: "warning",
  EMPLOYEE: "neutral",
  MARKETING: "warning",
  ACCOUNTANT: "warning",
  CLIENT: "neutral",
};

const STAFF_ROLES = [
  "SALES",
  "PM",
  "EMPLOYEE",
  "MARKETING",
  "ACCOUNTANT",
  "ADMIN",
];

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Dialogs
  const [impersonateUser, setImpersonateUser] =
    useState<AdminUserDetail | null>(null);
  const [resetPwUser, setResetPwUser] = useState<AdminUserDetail | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const roleFilter = activeFilters["role"]?.[0];
  const statusFilter = activeFilters["status"]?.[0];

  const filters: AdminUserFilters = {
    search: debouncedSearch || undefined,
    role: roleFilter,
    status: statusFilter as "active" | "inactive" | undefined,
    limit: 50,
  };

  const { data, isLoading, isError } = useSearchAdminUsersQuery(filters);
  const [bulkAction] = useBulkUserActionMutation();
  const [resetPassword] = useResetUserPasswordMutation();
  const [impersonate] = useImpersonateUserMutation();
  const [revokeSessions] = useRevokeUserSessionsMutation();

  const users = data?.items ?? [];

  // Handle select all
  useEffect(() => {
    if (selectAll && users.length > 0) {
      setSelectedIds(users.map((u) => u.id));
    } else if (selectAll) {
      setSelectAll(false);
    }
  }, [selectAll, users]);

  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
      setSelectedIds([]);
      setSelectAll(false);
    },
    [],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setSelectAll(false);
  };

  const filterGroups: FilterGroup[] = [
    {
      key: "role",
      label: "الدور",
      options: [
        { label: "الكل", value: "" },
        ...STAFF_ROLES.map((role) => ({
          label: ROLE_LABELS[role],
          value: role,
        })),
        { label: "عميل", value: "CLIENT" },
      ],
    },
    {
      key: "status",
      label: "الحالة",
      options: [
        { label: "الكل", value: "" },
        { label: "نشط", value: "active" },
        { label: "غير نشط", value: "inactive" },
      ],
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: "تفعيل",
      icon: Power,
      onExecute: async (ids) => {
        const res = await bulkAction({
          userIds: ids,
          action: "activate",
        }).unwrap();
        return res;
      },
    },
    {
      label: "تعطيل",
      icon: PowerOff,
      variant: "primary",
      requiresConfirmation: true,
      confirmationTitle: "تعطيل المستخدمين",
      confirmationMessage: "سيتم تعطيل الحسابات المحددة. هل أنت متأكد؟",
      onExecute: async (ids) => {
        const res = await bulkAction({
          userIds: ids,
          action: "deactivate",
        }).unwrap();
        return res;
      },
    },
    {
      label: "تصدير CSV",
      icon: Download,
      onExecute: async (ids) => {
        // Client-side CSV export
        const selectedUsers = users.filter((u) => ids.includes(u.id));
        const headers = [
          "الاسم",
          "البريد الإلكتروني",
          "الدور",
          "الحالة",
          "آخر تسجيل دخول",
        ];
        const rows = selectedUsers.map((u) => [
          u.name,
          u.email,
          ROLE_LABELS[u.role] ?? u.role,
          u.isActive ? "نشط" : "غير نشط",
          u.lastLoginAt ?? "",
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
          "\n",
        );
        const blob = new Blob(["\uFEFF" + csv], {
          type: "text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        return { affected: ids.length, failed: [] };
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إدارة المستخدمين"
        description={`إجمالي ${data?.total ?? 0} مستخدم`}
        icon={Users}
        actions={
          <ActionButton
            onClick={() => router.push("/dashboard/admin/users/new")}
          >
            <Plus className="size-4 mr-1" />
            مستخدم جديد
          </ActionButton>
        }
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث بالاسم أو الإيميل..."
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
      {(roleFilter || statusFilter) && (
        <div className="flex flex-wrap gap-2">
          {roleFilter && (
            <Pill tone="blue">{ROLE_LABELS[roleFilter] ?? roleFilter}</Pill>
          )}
          {statusFilter === "active" && <Pill tone="success">نشط</Pill>}
          {statusFilter === "inactive" && <Pill tone="danger">غير نشط</Pill>}
        </div>
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onClear={() => {
          setSelectedIds([]);
          setSelectAll(false);
        }}
        actions={bulkActions}
      />

      <DataTable
        columns={[
          { id: "select", label: "", width: "40px" },
          { id: "name", label: "الاسم" },
          { id: "email", label: "البريد الإلكتروني" },
          { id: "role", label: "الدور" },
          { id: "department", label: "القسم" },
          { id: "status", label: "الحالة" },
          { id: "lastLogin", label: "آخر نشاط" },
          { id: "actions", label: "الإجراءات", width: "200px" },
        ]}
        data={users}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل المستخدمين. يرجى تحديث الصفحة."
        emptyState={{
          icon: Users,
          message: "لا يوجد مستخدمون",
          hint: "ابدأ بإضافة مستخدم جديد",
        }}
        renderRow={(user: AdminUserDetail) => (
          <tr
            key={user.id}
            className={`border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50 transition-colors ${
              selectedIds.includes(user.id) ? "bg-secondary-50" : ""
            }`}
            onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
          >
            <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.includes(user.id)}
                onChange={() => toggleSelect(user.id)}
                className="h-4 w-4 rounded border-portal-divider text-secondary-500 focus:ring-secondary-500"
              />
            </td>
            <td className="px-5 py-4 text-base font-medium text-natural-100">
              {user.name}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text" dir="ltr">
              {user.email}
            </td>
            <td className="px-5 py-4">
              <Pill tone={ROLE_PILL_TONE[user.role] ?? "neutral"}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Pill>
            </td>
            <td className="px-5 py-4">
              {user.department ? (
                <Pill tone="neutral">{user.department}</Pill>
              ) : (
                <span className="text-sm text-portal-note-text">—</span>
              )}
            </td>
            <td className="px-5 py-4">
              <StatusBadge
                status={user.isActive ? "ACTIVE" : "STOPPED"}
                label={user.isActive ? "نشط" : "غير نشط"}
              />
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleDateString("ar-SA")
                : "—"}
            </td>
            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  title="إعادة تعيين كلمة المرور"
                  onClick={() => setResetPwUser(user)}
                >
                  <KeyRound className="size-3.5" />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  title="الدخول كـ"
                  onClick={() => setImpersonateUser(user)}
                >
                  <UserCheck className="size-3.5" />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  title="إنهاء الجلسات"
                  onClick={async () => {
                    try {
                      await revokeSessions(user.id).unwrap();
                      toast.success("تم إنهاء جميع جلسات المستخدم");
                    } catch {
                      toast.error("فشل إنهاء الجلسات");
                    }
                  }}
                >
                  <Monitor className="size-3.5" />
                </ActionButton>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Impersonate dialog */}
      {impersonateUser && (
        <ImpersonateDialog
          open={!!impersonateUser}
          onOpenChange={(open) => {
            if (!open) setImpersonateUser(null);
          }}
          userName={impersonateUser.name}
          onConfirm={async (reason) => {
            const res = await impersonate({
              id: impersonateUser.id,
              reason,
            }).unwrap();
            return res;
          }}
        />
      )}

      {/* Reset password dialog */}
      {resetPwUser && (
        <ResetPasswordDialog
          open={!!resetPwUser}
          onOpenChange={(open) => {
            if (!open) setResetPwUser(null);
          }}
          userName={resetPwUser.name}
          onConfirm={async () => {
            const res = await resetPassword(resetPwUser.id).unwrap();
            return res;
          }}
        />
      )}
    </div>
  );
}
