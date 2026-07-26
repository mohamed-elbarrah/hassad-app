"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared/AdminDetailSkeleton";
import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminProjectByIdQuery, useArchiveAdminProjectMutation, useUnarchiveAdminProjectMutation } from "@/features/admin/adminProjectsApi";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "الملخص" },
  { key: "/timeline", label: "التسلسل الزمني" },
  { key: "/periods", label: "الفترات" },
  { key: "/tasks", label: "المهام" },
  { key: "/deliverables", label: "التسليمات" },
  { key: "/team", label: "الفريق" },
  { key: "/finance", label: "المالية" },
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

export default function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const {
    data: project,
    isLoading,
    isError,
    refetch,
  } = useGetAdminProjectByIdQuery(id);

  const [archive] = useArchiveAdminProjectMutation();
  const [unarchive] = useUnarchiveAdminProjectMutation();

  const [actionModal, setActionModal] = useState<{
    type: "archive" | "unarchive";
  } | null>(null);

  const currentTab = useMemo(() => {
    for (const tab of TABS) {
      if (pathname.endsWith(`/projects/${id}${tab.key}`)) return tab.key;
    }
    return "";
  }, [pathname, id]);

  const handleAction = async (_reason: string) => {
    if (!actionModal) return;
    try {
      if (actionModal.type === "archive") {
        await archive(id).unwrap();
      } else if (actionModal.type === "unarchive") {
        await unarchive(id).unwrap();
      }
    } catch { /* best-effort operation; the UI remains usable without this refresh */ }
    setActionModal(null);
  };

  if (isLoading) return <AdminDetailSkeleton />;

  if (isError || !project) {
    return (
      <AdminDetailError
        onRetry={refetch}
        backHref="/dashboard/admin/projects"
        backLabel="المشاريع"
        title="حدث خطأ أثناء تحميل بيانات المشروع"
      />
    );
  }

  return (
    <div className="page-shell" dir="rtl">
      <div className="flex items-center justify-between">
        <AdminDetailBreadcrumb
          backHref="/dashboard/admin/projects"
          backLabel="المشاريع"
          title={project.name}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-portal-note-text">
            {project.client.companyName}
          </span>
          <AdminStatusBadge domain="project" status={project.status} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/admin/clients/${project.client.id}`}
          className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border text-portal-note-text hover:text-natural-100"
        >
          عرض العميل
        </Link>
        {project.contractId && (
          <Link
            href={`/dashboard/admin/contracts/${project.contractId}`}
            className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >
            عرض العقد
          </Link>
        )}
        {project.isArchived ? (
          <button
            onClick={() => setActionModal({ type: "unarchive" })}
            className="px-3 py-1.5 text-sm rounded-xl bg-success-100 text-success-700 hover:bg-success-200"
          >
            إلغاء الأرشفة
          </button>
        ) : (
          <button
            onClick={() => setActionModal({ type: "archive" })}
            className="px-3 py-1.5 text-sm rounded-xl bg-warning-100 text-warning-700 hover:bg-warning-200"
          >
            أرشفة
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 border-b border-portal-divider">
        {TABS.map((tab) => {
          const href = tab.key
            ? `/dashboard/admin/projects/${id}${tab.key}`
            : `/dashboard/admin/projects/${id}`;
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
        open={actionModal?.type === "archive"}
        title="أرشفة المشروع"
        description="سيتم أرشفة المشروع. لن يظهر في القوائم النشطة."
        confirmLabel="أرشفة"
        confirmVariant="warning"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />

      <ActionModal
        open={actionModal?.type === "unarchive"}
        title="إلغاء أرشفة المشروع"
        description="سيتم إعادة المشروع إلى الحالة النشطة."
        confirmLabel="إلغاء الأرشفة"
        confirmVariant="primary"
        onConfirm={handleAction}
        onCancel={() => setActionModal(null)}
      />
    </div>
  );
}
