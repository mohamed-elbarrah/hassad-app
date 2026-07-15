"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared/AdminDetailSkeleton";
import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import {
  useGetAdminUserByIdQuery,
  useSuspendAdminUserMutation,
  useReactivateAdminUserMutation,
  useResetAdminUserPasswordMutation,
  useRevokeAdminUserSessionsMutation,
} from "@/features/admin/adminUsersApi";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "الملف الشخصي" },
  { key: "/sessions", label: "الجلسات" },
  { key: "/activity", label: "النشاط" },
  { key: "/permissions", label: "الصلاحيات" },
];

function ActionModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "warning" | "primary";
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" dir="rtl">
        <h3 className="text-lg font-semibold text-natural-100 mb-2">{title}</h3>
        <p className="text-sm text-portal-note-text mb-4">{description}</p>
        <textarea
          className="w-full rounded-xl border border-portal-card-border p-3 text-sm resize-none h-24"
          placeholder="سبب الإجراء (مطلوب)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
              confirmVariant === "danger"
                ? "bg-danger-500 hover:bg-danger-600"
                : confirmVariant === "warning"
                  ? "bg-warning-500 hover:bg-warning-600"
                  : "bg-secondary-500 hover:bg-secondary-600"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useGetAdminUserByIdQuery(id);

  const [suspend] = useSuspendAdminUserMutation();
  const [reactivate] = useReactivateAdminUserMutation();
  const [resetPassword] = useResetAdminUserPasswordMutation();
  const [revokeSessions] = useRevokeAdminUserSessionsMutation();

  const [actionModal, setActionModal] = useState<{
    type: "suspend" | "reactivate" | "reset-password" | "revoke-sessions";
  } | null>(null);

  const currentTab = useMemo(() => {
    for (const tab of TABS) {
      if (pathname.endsWith(`/employees/${id}${tab.key}`)) return tab.key;
    }
    return "";
  }, [pathname, id]);

  const handleAction = async (reason: string) => {
    if (!actionModal) return;
    try {
      if (actionModal.type === "suspend") {
        await suspend(id).unwrap();
      } else if (actionModal.type === "reactivate") {
        await reactivate(id).unwrap();
      } else if (actionModal.type === "reset-password") {
        await resetPassword(id).unwrap();
      } else if (actionModal.type === "revoke-sessions") {
        await revokeSessions(id).unwrap();
      }
    } catch {}
    setActionModal(null);
  };

  if (isLoading) return <AdminDetailSkeleton />;

  if (isError || !user) {
    return (
      <AdminDetailError
        onRetry={refetch}
        backHref="/dashboard/admin/employees"
        backLabel="الموظفون"
        title="حدث خطأ أثناء تحميل بيانات الموظف"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <div className="flex items-center justify-between">
        <AdminDetailBreadcrumb
          backHref="/dashboard/admin/employees"
          backLabel="الموظفون"
          title={user.name}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-portal-note-text">{user.email}</span>
          <AdminStatusBadge domain="user" status={user.role} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user.isActive ? (
          <button
            onClick={() => setActionModal({ type: "suspend" })}
            className="px-3 py-1.5 text-sm rounded-xl bg-danger-100 text-danger-700 hover:bg-danger-200"
          >
            تعليق
          </button>
        ) : (
          <button
            onClick={() => setActionModal({ type: "reactivate" })}
            className="px-3 py-1.5 text-sm rounded-xl bg-success-100 text-success-700 hover:bg-success-200"
          >
            تفعيل
          </button>
        )}
        <button
          onClick={() => setActionModal({ type: "reset-password" })}
          className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border text-portal-note-text hover:text-natural-100"
        >
          إعادة تعيين كلمة المرور
        </button>
        <button
          onClick={() => setActionModal({ type: "revoke-sessions" })}
          className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border text-warning-600 hover:bg-warning-50"
        >
          إنهاء جميع الجلسات
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-portal-divider">
        {TABS.map((tab) => {
          const href = tab.key
            ? `/dashboard/admin/employees/${id}${tab.key}`
            : `/dashboard/admin/employees/${id}`;
          const isActive = currentTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-secondary-500 text-secondary-500"
                  : "border-transparent text-portal-note-text hover:text-natural-100",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <ActionModal
        open={actionModal?.type === "suspend"}
        title="تعليق الموظف"
        description="سيتم تعليق حساب الموظف. لن يتمكن من تسجيل الدخول أو الوصول إلى النظام."
        confirmLabel="تعليق"
        confirmVariant="danger"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />

      <ActionModal
        open={actionModal?.type === "reactivate"}
        title="تفعيل الموظف"
        description="سيتم إعادة تفعيل حساب الموظف."
        confirmLabel="تفعيل"
        confirmVariant="primary"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />

      <ActionModal
        open={actionModal?.type === "reset-password"}
        title="إعادة تعيين كلمة المرور"
        description="سيتم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني للموظف."
        confirmLabel="إرسال"
        confirmVariant="primary"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />

      <ActionModal
        open={actionModal?.type === "revoke-sessions"}
        title="إنهاء جميع الجلسات"
        description="سيتم إنهاء جميع جلسات الموظف النشطة. ستحتاج إعادة تسجيل الدخول."
        confirmLabel="إنهاء"
        confirmVariant="warning"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />
    </div>
  );
}
