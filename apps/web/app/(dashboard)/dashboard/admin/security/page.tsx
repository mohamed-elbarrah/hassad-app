"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Activity,
  ShieldAlert,
  UserX,
  Users,
  Search,
} from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { Pagination } from "@/components/design-system/Pagination";
import { Pill } from "@/components/design-system/Pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetSecurityEventsQuery,
  useGetSecurityStatsQuery,
  type SecurityEvent,
} from "@/features/admin/adminApi";
import { formatDateTimeTz } from "@/lib/format";

const EVENT_TYPE_OPTIONS = [
  { label: "كل الأحداث", value: "all" },
  { label: "تسجيل دخول", value: "LOGIN_SUCCESS" },
  { label: "محاولة دخول فاشلة", value: "LOGIN_FAILED" },
  { label: "انتحال صلاحيات", value: "IMPERSONATION" },
  { label: "إعادة تعيين كلمة المرور", value: "PASSWORD_RESET" },
  { label: "قفل الحساب", value: "ACCOUNT_LOCKED" },
  { label: "فتح الحساب", value: "ACCOUNT_UNLOCKED" },
  { label: "إلغاء جلسة", value: "SESSION_REVOKED" },
  { label: "تغيير الدور", value: "ROLE_CHANGED" },
  { label: "تعطيل التحقق بخطوتين", value: "TWO_FACTOR_DISABLED" },
];

const EVENT_TYPE_PILL_TONES: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "purple" | "blue"
> = {
  LOGIN_SUCCESS: "success",
  LOGIN_FAILED: "warning",
  IMPERSONATION: "danger",
  PASSWORD_RESET: "blue",
  ACCOUNT_LOCKED: "danger",
  ACCOUNT_UNLOCKED: "success",
  SESSION_REVOKED: "warning",
  LOGOUT: "neutral",
  ROLE_CHANGED: "purple",
  TWO_FACTOR_DISABLED: "warning",
};

const EVENT_TYPE_AR: Record<string, string> = {
  LOGIN_SUCCESS: "تسجيل دخول",
  LOGIN_FAILED: "محاولة دخول فاشلة",
  LOGOUT: "تسجيل خروج",
  IMPERSONATION: "انتحال صلاحيات",
  PASSWORD_RESET: "إعادة تعيين كلمة المرور",
  ACCOUNT_LOCKED: "قفل الحساب",
  ACCOUNT_UNLOCKED: "فتح الحساب",
  SESSION_REVOKED: "إلغاء جلسة",
  ROLE_CHANGED: "تغيير الدور",
  TWO_FACTOR_DISABLED: "تعطيل التحقق بخطوتين",
};

const TIME_RANGE_OPTIONS = [
  { label: "اليوم", days: 0 },
  { label: "آخر 7 أيام", days: 7 },
  { label: "آخر 30 يوم", days: 30 },
  { label: "الكل", days: -1 },
] as const;

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminSecurityPage() {
  const [page, setPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [timeRange, setTimeRange] = useState<number>(-1);

  const applyTimeRange = (days: number) => {
    setTimeRange(days);
    setPage(1);
    if (days === -1) {
      setFromDate("");
      setToDate("");
    } else if (days === 0) {
      const today = new Date().toISOString().slice(0, 10);
      setFromDate(today);
      setToDate(today);
    } else {
      const to = new Date();
      const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
      setFromDate(from.toISOString().slice(0, 10));
      setToDate(to.toISOString().slice(0, 10));
    }
  };

  const debouncedUserSearch = useDebounce(userSearchInput, 400);

  const { data: stats } = useGetSecurityStatsQuery();

  const filters = {
    ...(eventTypeFilter && { type: eventTypeFilter }),
    ...(debouncedUserSearch && { userId: debouncedUserSearch }),
    ...(fromDate && { from: new Date(fromDate).toISOString() }),
    ...(toDate && { to: new Date(toDate).toISOString() }),
    page,
    limit: 25,
  };

  const { data, isLoading, isError } = useGetSecurityEventsQuery(filters);

  const events = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="الأمان"
        description="مراقبة الأحداث الأمنية والنشاطات المشبوهة في النظام"
        icon={Shield}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الأحداث (24 ساعة)"
          value={stats?.totalEvents ?? 0}
          icon={Activity}
        />
        <StatCard
          title="محاولات دخول فاشلة"
          value={stats?.failedLogins24h ?? 0}
          icon={ShieldAlert}
          variant="danger"
        />
        <StatCard
          title="الجلسات النشطة"
          value={stats?.activeSessions ?? 0}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="انتحال صلاحيات"
          value={stats?.impersonations7d ?? 0}
          icon={UserX}
          variant="warning"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center p-4 bg-natural-0 rounded-2xl border border-portal-card-border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث عن مستخدم..."
            value={userSearchInput}
            onChange={(e) => setUserSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>

        <Select
          value={eventTypeFilter || "all"}
          onValueChange={(v) => {
            setEventTypeFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] h-10 text-sm rounded-xl">
            <SelectValue placeholder="كل الأحداث" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 text-sm rounded-xl border border-portal-card-border bg-transparent text-portal-note-text"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 text-sm rounded-xl border border-portal-card-border bg-transparent text-portal-note-text"
        />

        <div className="flex gap-1.5">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => applyTimeRange(opt.days)}
              className={`h-9 px-3 text-xs rounded-xl border transition-colors ${
                timeRange === opt.days
                  ? "border-secondary-500 bg-secondary-50 text-secondary-700"
                  : "border-portal-card-border text-portal-note-text hover:bg-badge-gray-bg"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {data && (
          <span className="text-sm text-portal-note-text mr-auto">
            {data.total} حدث
          </span>
        )}
      </div>

      <SurfaceCard>
        <DataTable
          columns={[
            { id: "type", label: "الحدث" },
            { id: "user", label: "المستخدم" },
            { id: "ip", label: "IP" },
            { id: "date", label: "التاريخ", align: "left" },
          ]}
          data={events}
          isLoading={isLoading}
          isError={isError}
          emptyState={{
            icon: Shield,
            message: "لا توجد أحداث أمنية",
            hint: "ستظهر الأحداث هنا عند حدوثها",
          }}
          renderRow={(event: SecurityEvent) => (
            <tr
              key={event.id}
              className="border-b-[1.5px] border-portal-divider"
            >
              <td className="px-5 py-4">
                <Pill
                  tone={EVENT_TYPE_PILL_TONES[event.type] ?? "neutral"}
                >
                  {EVENT_TYPE_AR[event.type] ?? event.type}
                </Pill>
              </td>
              <td className="px-5 py-4">
                {event.userName ? (
                  <div className="flex flex-col">
                    <span className="text-base text-natural-100">
                      {event.userName}
                    </span>
                    {event.userEmail && (
                      <span className="text-xs text-portal-note-text">
                        {event.userEmail}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-portal-note-text">—</span>
                )}
              </td>
              <td className="px-5 py-4">
                <span
                  className="text-sm text-portal-note-text font-mono"
                  dir="ltr"
                >
                  {event.ip ?? "—"}
                </span>
              </td>
              <td
                className="px-5 py-4 text-sm text-portal-note-text text-left"
                dir="ltr"
              >
                {formatDateTimeTz(event.createdAt)}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
