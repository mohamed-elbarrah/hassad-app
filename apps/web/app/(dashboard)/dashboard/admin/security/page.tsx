"use client";

import { useMemo, useState } from "react";
import { Shield, AlertTriangle, UserX, Key, Users, ShieldCheck } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { Input } from "@/components/design-system/Input";
import { useGetAdminSecurityEventsQuery, useGetAdminSecurityStatsQuery } from "@/features/admin/adminUsersApi";

const COLUMNS: DataTableColumn[] = [
  { id: "type", label: "النوع", align: "right" },
  { id: "userName", label: "المستخدم", align: "right" },
  { id: "userEmail", label: "البريد الإلكتروني", align: "right" },
  { id: "ip", label: "عنوان IP", align: "right" },
  { id: "createdAt", label: "التاريخ", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: Shield,
  message: "لا يوجد أحداث أمنية",
  hint: "لم يتم تسجيل أي أحداث أمنية بعد.",
};

const EVENT_TYPE_OPTIONS = [
  { label: "محاولة دخول فاشلة", value: "FAILED_LOGIN" },
  { label: "انتحال شخصية", value: "IMPERSONATE" },
  { label: "إعادة تعيين كلمة المرور", value: "PASSWORD_RESET" },
  { label: "جلسة نشطة", value: "ACTIVE_SESSION" },
  { label: "تفعيل المصادقة الثنائية", value: "TWO_FACTOR" },
];

export default function AdminSecurityPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const { data, isLoading, isError } = useGetAdminSecurityEventsQuery({
    type: activeFilters.type?.[0],
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 20,
  });

  const { data: stats } = useGetAdminSecurityStatsQuery();

  const events = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => [
    { label: "إجمالي الأحداث", value: stats?.totalEvents ?? 0, icon: Shield },
    { label: "محاولات دخول فاشلة (24 ساعة)", value: stats?.failedLogins24h ?? 0, icon: AlertTriangle },
    { label: "انتحال شخصية (7 أيام)", value: stats?.impersonations7d ?? 0, icon: UserX },
    { label: "إعادة تعيين كلمة المرور (7 أيام)", value: stats?.passwordResets7d ?? 0, icon: Key },
    { label: "الجلسات النشطة", value: stats?.activeSessions ?? 0, icon: Users },
    { label: "المصادقة الثنائية", value: stats?.twoFactorEnabled ?? 0, icon: ShieldCheck },
  ], [stats]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الأمان"
        description="مراقبة الأحداث الأمنية والجلسات النشطة"
        icon={Shield}
      />

      <div className="grid grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[30px] border-[1.5px] border-portal-card-border p-5"
          >
            <p className="text-sm text-portal-note-text">{card.label}</p>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <SurfaceCard title="الأحداث الأمنية">
        <div className="mb-4 flex flex-col gap-3">
          <AdminListToolbar
            search=""
            onSearchChange={() => {}}
            searchPlaceholder=""
            filterGroups={[
              {
                key: "type",
                label: "النوع",
                options: EVENT_TYPE_OPTIONS,
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(key, values) =>
              setActiveFilters((prev) => ({ ...prev, [key]: values }))
            }
          />
          <div className="flex gap-3">
            <Input
              placeholder="من تاريخ (YYYY-MM-DD)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              placeholder="إلى تاريخ (YYYY-MM-DD)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          columns={COLUMNS}
          data={events}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل الأحداث الأمنية."
          emptyState={EMPTY_STATE}
          renderRow={(event) => (
            <tr
              key={event.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <span className="text-sm font-medium text-natural-100">{event.type}</span>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {event.userName || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {event.userEmail || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text font-mono">
                {event.ip || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {new Date(event.createdAt).toLocaleDateString("ar-SA")}
              </td>
            </tr>
          )}
        />

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
