"use client";

import { useState, useEffect } from "react";
import { Search, Monitor, XCircle, Smartphone, Tablet } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { StatCard } from "@/components/design-system/StatCard";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import {
  useGetAdminSessionsQuery,
  useRevokeSessionMutation,
  type AdminSession,
} from "@/features/admin/adminApi";
import { formatRelativeTime } from "@/lib/format";

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function sessionDeviceIcon(ua: string | null) {
  if (!ua) return Monitor;
  const lua = ua.toLowerCase();
  if (/tablet|ipad/i.test(lua)) return Tablet;
  if (/mobile|android|iphone|ios/i.test(lua)) return Smartphone;
  return Monitor;
}

export default function AdminSessionsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<AdminSession | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const filters: any = {
    search: debouncedSearch || undefined,
  };

  const { data, isLoading, isError } = useGetAdminSessionsQuery(filters);
  const [revokeSession] = useRevokeSessionMutation();

  const sessions = data?.items ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const activeToday = sessions.filter(
    (s) => s.isActive && s.createdAt.slice(0, 10) === today,
  ).length;
  const desktopSessions = sessions.filter(
    (s) => s.userAgent && !/mobile|android|ios|iphone|ipad|tablet/i.test(s.userAgent),
  ).length;
  const mobileSessions = sessions.filter(
    (s) => s.userAgent && /mobile|android|ios|iphone|ipad|tablet/i.test(s.userAgent),
  ).length;

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeSession(revokeTarget.id).unwrap();
      toast.success("تم إنهاء الجلسة بنجاح");
      setRevokeTarget(null);
    } catch {
      toast.error("فشل إنهاء الجلسة");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="الجلسات النشطة"
        description={`إجمالي ${data?.total ?? 0} جلسة`}
        icon={Monitor}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الجلسات"
          value={data?.total ?? 0}
          icon={Monitor}
        />
        <StatCard
          title="نشطة اليوم"
          value={activeToday}
          icon={Monitor}
          variant="success"
        />
        <StatCard
          title="سطح المكتب"
          value={desktopSessions}
          icon={Monitor}
        />
        <StatCard
          title="الجوال"
          value={mobileSessions}
          icon={Smartphone}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث عن مستخدم..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      <DataTable
        columns={[
          { id: "user", label: "المستخدم" },
          { id: "email", label: "البريد الإلكتروني" },
          { id: "device", label: "الجهاز" },
          { id: "ip", label: "IP" },
          { id: "createdAt", label: "تاريخ الإنشاء" },
          { id: "status", label: "الحالة" },
          { id: "actions", label: "الإجراءات", width: "80px" },
        ]}
        data={sessions}
        isLoading={isLoading}
        isError={isError}
        emptyState={{
          icon: Monitor,
          message: "لا توجد جلسات",
          hint: "لم يتم العثور على جلسات تطابق معايير البحث",
        }}
        renderRow={(s: AdminSession) => (
          <tr
            key={s.id}
            className="border-b border-portal-divider hover:bg-badge-gray-bg/50"
          >
            <td className="px-5 py-4 text-base font-medium text-natural-100">
              {s.userName}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text">
              {s.userEmail}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text max-w-[200px] truncate" dir="ltr">
              {s.userAgent ? (
                <span className="inline-flex items-center gap-1.5">
                  {(() => {
                    const Icon = sessionDeviceIcon(s.userAgent);
                    return <Icon className="size-4 shrink-0" />;
                  })()}
                  <span className="truncate">{s.userAgent}</span>
                </span>
              ) : (
                "—"
              )}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text font-mono" dir="ltr">
              {s.ip ?? "—"}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text whitespace-nowrap">
              {formatRelativeTime(s.createdAt)}
            </td>
            <td className="px-5 py-4">
              {s.isActive ? (
                <StatusBadge status="ACTIVE" label="نشطة" />
              ) : (
                <StatusBadge status="INACTIVE" label="منتهية" />
              )}
            </td>
            <td className="px-5 py-4">
              {s.isActive && (
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  title="إنهاء الجلسة"
                  onClick={() => setRevokeTarget(s)}
                >
                  <XCircle className="size-3.5" />
                </ActionButton>
              )}
            </td>
          </tr>
        )}
      />

      <Dialog
        open={!!revokeTarget}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null);
        }}
        title="إنهاء الجلسة"
        description={`هل أنت متأكد من إنهاء جلسة المستخدم "${revokeTarget?.userName}"؟`}
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setRevokeTarget(null)}
            >
              إلغاء
            </ActionButton>
            <ActionButton variant="primary" onClick={handleRevoke}>
              تأكيد الإنهاء
            </ActionButton>
          </div>
        }
      >
        <div />
      </Dialog>
    </div>
  );
}
