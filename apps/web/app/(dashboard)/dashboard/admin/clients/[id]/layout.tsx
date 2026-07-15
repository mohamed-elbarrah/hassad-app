"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared/AdminDetailSkeleton";
import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import {
  useGetAdminClientByIdQuery,
  useSuspendAdminClientMutation,
  useReactivateAdminClientMutation,
  useToggleAdminClientPortalAccessMutation,
  useRegenerateAdminClientPortalTokenMutation,
} from "@/features/admin/adminClientsApi";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "نظرة عامة" },
  { key: "/contracts", label: "العقود" },
  { key: "/projects", label: "المشاريع" },
  { key: "/invoices", label: "الفواتير" },
  { key: "/history", label: "سجل النشاط" },
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

export default function ClientDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const {
    data: client,
    isLoading,
    isError,
    refetch,
  } = useGetAdminClientByIdQuery(id);

  const [suspend] = useSuspendAdminClientMutation();
  const [reactivate] = useReactivateAdminClientMutation();
  const [togglePortal] = useToggleAdminClientPortalAccessMutation();
  const [regenerateToken] = useRegenerateAdminClientPortalTokenMutation();

  const [actionModal, setActionModal] = useState<{
    type: "suspend" | "reactivate" | "toggle-portal" | "regenerate-token";
  } | null>(null);

  const currentTab = useMemo(() => {
    for (const tab of TABS) {
      if (pathname.endsWith(`/clients/${id}${tab.key}`)) return tab.key;
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
      } else if (actionModal.type === "toggle-portal") {
        await togglePortal(id).unwrap();
      } else if (actionModal.type === "regenerate-token") {
        await regenerateToken(id).unwrap();
      }
    } catch {}
    setActionModal(null);
  };

  if (isLoading) return <AdminDetailSkeleton />;

  if (isError || !client) {
    return (
      <AdminDetailError
        onRetry={refetch}
        backHref="/dashboard/admin/clients"
        backLabel="العملاء"
        title="حدث خطأ أثناء تحميل بيانات العميل"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <div className="flex items-center justify-between">
        <AdminDetailBreadcrumb
          backHref="/dashboard/admin/clients"
          backLabel="العملاء"
          title={client.companyName || client.businessName}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-portal-note-text">{client.email}</span>
          <AdminStatusBadge domain="client" status={client.status} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/admin/clients/${id}/edit`}
            className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >
            تعديل
          </Link>
          <Link
            href={`/dashboard/admin/requests/new?clientId=${id}`}
            className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border text-secondary-500 hover:text-secondary-600"
          >
            طلب جديد
          </Link>
          {client.isActive ? (
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
            onClick={() => setActionModal({ type: "toggle-portal" })}
            className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >
            {client.portalAccess ? "إيقاف البوابة" : "تفعيل البوابة"}
          </button>
          <button
            onClick={() => setActionModal({ type: "regenerate-token" })}
            className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >
            إعادة رابط البوابة
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-portal-divider">
        {TABS.map((tab) => {
          const href = tab.key
            ? `/dashboard/admin/clients/${id}${tab.key}`
            : `/dashboard/admin/clients/${id}`;
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
        title="تعليق العميل"
        description="سيتم تعليق حساب العميل. لن يتمكن من الوصول إلى البوابة أو إجراء عمليات جديدة."
        confirmLabel="تعليق"
        confirmVariant="danger"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />

      <ActionModal
        open={actionModal?.type === "reactivate"}
        title="تفعيل العميل"
        description="سيتم إعادة تفعيل حساب العميل."
        confirmLabel="تفعيل"
        confirmVariant="primary"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />

      <ActionModal
        open={actionModal?.type === "toggle-portal"}
        title={client?.portalAccess ? "إيقاف الوصول للبوابة" : "تفعيل الوصول للبوابة"}
        description="سيتم تغيير حالة وصول العميل لبوابة الخدمات."
        confirmLabel="تأكيد"
        confirmVariant="primary"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />

      <ActionModal
        open={actionModal?.type === "regenerate-token"}
        title="إعادة إنشاء رابط البوابة"
        description="سيتم إعادة إنشاء رابط دخول العميل للبوابة. الرابط القديم سيتوقف عن العمل."
        confirmLabel="إعادة الإنشاء"
        confirmVariant="warning"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />
    </div>
  );
}
