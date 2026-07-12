"use client";

import { useMemo, useState } from "react";
import { LogIn, XCircle } from "lucide-react";
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
  useGetAdminSessionsQuery,
  useRevokeAdminSessionMutation,
} from "@/features/admin/adminUsersApi";

const COLUMNS: DataTableColumn[] = [
  { id: "userName", label: "المستخدم", align: "right" },
  { id: "userEmail", label: "البريد الإلكتروني", align: "right" },
  { id: "userAgent", label: "المتصفح", align: "right" },
  { id: "ip", label: "IP", align: "right" },
  { id: "createdAt", label: "تاريخ البدء", align: "right" },
  { id: "expiresAt", label: "تاريخ الانتهاء", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "actions", label: "إجراء", align: "center" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: LogIn,
  message: "لا توجد جلسات نشطة",
  hint: "لم يتم تسجيل أي جلسات دخول بعد.",
};

export default function AdminSessionsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const { data, isLoading, isError } = useGetAdminSessionsQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  const [revokeSession, { isLoading: isRevoking }] =
    useRevokeAdminSessionMutation();

  const sessions = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const active = sessions.filter((s) => s.isActive).length;
    const expired = sessions.filter((s) => !s.isActive).length;
    return { total, active, expired };
  }, [data, sessions]);

  const handleRevoke = async (id: string) => {
    try {
      await revokeSession(id).unwrap();
    } catch {
      // Error handled by RTK
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col gap-5" dir="rtl">
        <AdminEmptyState
          icon={LogIn}
          title="حدث خطأ أثناء تحميل الجلسات"
          description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الجلسات"
        description="إدارة جلسات تسجيل دخول المستخدمين"
        icon={LogIn}
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
            label: "منتهي",
            value: statCards.expired,
            className: "bg-portal-card-border/50 text-portal-note-text",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-[30px] border-[1.5px] border-portal-card-border p-5 ${card.className}`}
          >
            <p className="text-sm text-portal-note-text">{card.label}</p>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <SurfaceCard title="قائمة الجلسات">
        <div className="mb-4">
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="بحث بالاسم أو البريد الإلكتروني..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: [
                  { label: "نشط", value: "active" },
                  { label: "منتهي", value: "expired" },
                ],
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
          data={sessions}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل الجلسات."
          emptyState={EMPTY_STATE}
          renderRow={(session) => (
            <tr
              key={session.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
                {session.userName}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {session.userEmail}
              </td>
              <td className="py-3 px-2 text-right text-xs text-portal-note-text max-w-[180px] truncate">
                {session.userAgent || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {session.ip || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {new Date(session.createdAt).toLocaleDateString("ar-SA")}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {new Date(session.expiresAt).toLocaleDateString("ar-SA")}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge
                  domain="client"
                  status={session.isActive ? "ACTIVE" : "STOPPED"}
                />
              </td>
              <td className="py-3 px-2 text-center">
                {session.isActive && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={isRevoking}
                    className="inline-flex items-center gap-1 rounded-lg bg-danger-500/10 px-2.5 py-1.5 text-xs font-medium text-danger-500 transition-colors hover:bg-danger-500/20 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    إنهاء
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
