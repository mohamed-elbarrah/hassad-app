"use client";

import { useState } from "react";
import {
  User,
  Activity,
  Monitor,
  Lock,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { DataTable } from "@/components/design-system/DataTable";
import { Skeleton } from "@/components/design-system/Skeleton";
import { formatDate } from "@/lib/format";
import type { AdminUserDetail, SecurityEvent, AdminSession } from "@/features/admin/adminApi";

interface UserDetailTabsProps {
  user: AdminUserDetail | null;
  isLoading: boolean;
  activity: any;
  isActivityLoading: boolean;
  sessions: AdminSession[];
  isSessionsLoading: boolean;
  securityEvents: SecurityEvent[];
  isSecurityLoading: boolean;
  onRevokeSession: (sessionId: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير النظام",
  PM: "مدير مشروع",
  SALES: "مبيعات",
  EMPLOYEE: "موظف",
  MARKETING: "تسويق",
  ACCOUNTANT: "محاسب",
  CLIENT: "عميل",
};

const ROLE_PILL_TONE: Record<string, "danger" | "neutral" | "warning" | "success" | "blue"> = {
  ADMIN: "danger",
  PM: "neutral",
  SALES: "warning",
  EMPLOYEE: "neutral",
  MARKETING: "warning",
  ACCOUNTANT: "warning",
  CLIENT: "neutral",
};

const SECURITY_EVENT_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: "تسجيل دخول ناجح",
  LOGIN_FAILED: "محاولة دخول فاشلة",
  PASSWORD_RESET: "إعادة تعيين كلمة المرور",
  PASSWORD_RESET_REQUESTED: "طلب إعادة تعيين كلمة المرور",
  IMPERSONATION: "دخول كـ (مدير النظام)",
  TWO_FACTOR_ENABLED: "تفعيل التحقق بخطوتين",
  TWO_FACTOR_DISABLED: "تعطيل التحقق بخطوتين",
  SESSION_REVOKED: "إلغاء جلسة",
  ACCOUNT_LOCKED: "قفل الحساب",
  ACCOUNT_UNLOCKED: "فتح الحساب",
  ROLE_CHANGED: "تغيير الدور",
  PERMISSION_GRANTED: "منح صلاحية",
  PERMISSION_REVOKED: "سحب صلاحية",
};

export function UserDetailTabs({
  user,
  isLoading,
  activity,
  isActivityLoading,
  sessions,
  isSessionsLoading,
  securityEvents,
  isSecurityLoading,
  onRevokeSession,
}: UserDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("profile");

  if (isLoading || !user) {
    return (
      <SurfaceCard>
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-5 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard>
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="w-full justify-start gap-1 px-4 pt-4">
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <User className="size-4" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5">
            <Activity className="size-4" />
            النشاطات
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-1.5">
            <Monitor className="size-4" />
            الجلسات
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5">
            <Lock className="size-4" />
            الأمان
          </TabsTrigger>
        </TabsList>

        <div className="p-6">
          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-portal-note-text">الاسم</span>
                  <p className="text-base font-medium text-natural-100">{user.name}</p>
                </div>
                <div>
                  <span className="text-sm text-portal-note-text">البريد الإلكتروني</span>
                  <p className="text-base font-medium text-natural-100" dir="ltr">{user.email}</p>
                </div>
                <div>
                  <span className="text-sm text-portal-note-text">الدور</span>
                  <div className="mt-1">
                    <Pill tone={ROLE_PILL_TONE[user.role] ?? "neutral"}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Pill>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-portal-note-text">القسم</span>
                  <p className="text-base font-medium text-natural-100">
                    {user.department ?? "—"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-portal-note-text">الحالة</span>
                  <div className="mt-1">
                    <StatusBadge
                      status={user.isActive ? "ACTIVE" : "STOPPED"}
                      label={user.isActive ? "نشط" : "غير نشط"}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-sm text-portal-note-text">آخر تسجيل دخول</span>
                  <p className="text-base font-medium text-natural-100">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-portal-note-text">التحقق بخطوتين</span>
                  <p className="text-base font-medium text-natural-100">
                    {user.twoFactorEnabled ? "مفعل" : "غير مفعل"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-portal-note-text">محاولات دخول فاشلة</span>
                  <p className="text-base font-medium text-natural-100">
                    {user.failedLoginAttempts}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-portal-note-text">تاريخ الإنشاء</span>
                  <p className="text-base font-medium text-natural-100">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <DataTable
              columns={[
                { id: "action", label: "الإجراء" },
                { id: "entity", label: "الكيان" },
                { id: "entityId", label: "المعرف" },
                { id: "createdAt", label: "التاريخ", align: "left" },
              ]}
              data={activity?.items ?? []}
              isLoading={isActivityLoading}
              isError={false}
              emptyState={{
                icon: Activity,
                message: "لا توجد نشاطات",
                hint: "لا توجد سجلات نشاط لهذا المستخدم",
              }}
              renderRow={(entry: any) => (
                <tr key={entry.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium text-natural-100">
                    {entry.action}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text">
                    {entry.entity}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text font-mono">
                    {entry.entityId?.slice(0, 8)}...
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left" dir="ltr">
                    {formatDate(entry.createdAt)}
                  </td>
                </tr>
              )}
            />
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <DataTable
              columns={[
                { id: "userAgent", label: "المتصفح" },
                { id: "ip", label: "IP" },
                { id: "createdAt", label: "تاريخ البدء", align: "left" },
                { id: "expiresAt", label: "تاريخ الانتهاء", align: "left" },
                { id: "status", label: "الحالة" },
                { id: "actions", label: "الإجراءات", width: "80px" },
              ]}
              data={sessions}
              isLoading={isSessionsLoading}
              isError={false}
              emptyState={{
                icon: Monitor,
                message: "لا توجد جلسات نشطة",
                hint: "لا توجد جلسات تسجيل دخول نشطة لهذا المستخدم",
              }}
              renderRow={(session: AdminSession) => (
                <tr key={session.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm text-natural-100 max-w-[200px] truncate">
                    {session.userAgent ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text font-mono" dir="ltr">
                    {session.ip ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left" dir="ltr">
                    {formatDate(session.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left" dir="ltr">
                    {formatDate(session.expiresAt)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={session.isActive ? "ACTIVE" : "STOPPED"}
                      label={session.isActive ? "نشطة" : "منتهية"}
                    />
                  </td>
                  <td className="px-5 py-3">
                    {session.isActive && (
                      <button
                        className="text-xs text-danger-500 hover:text-danger-600 font-medium"
                        onClick={() => onRevokeSession(session.id)}
                      >
                        إنهاء
                      </button>
                    )}
                  </td>
                </tr>
              )}
            />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <DataTable
              columns={[
                { id: "type", label: "الحدث" },
                { id: "ip", label: "IP" },
                { id: "createdAt", label: "التاريخ", align: "left" },
              ]}
              data={securityEvents}
              isLoading={isSecurityLoading}
              isError={false}
              emptyState={{
                icon: Lock,
                message: "لا توجد أحداث أمان",
                hint: "لا توجد أحداث أمان مسجلة لهذا المستخدم",
              }}
              renderRow={(event: SecurityEvent) => (
                <tr key={event.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium text-natural-100">
                    {SECURITY_EVENT_LABELS[event.type] ?? event.type}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text font-mono" dir="ltr">
                    {event.ip ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left" dir="ltr">
                    {formatDate(event.createdAt)}
                  </td>
                </tr>
              )}
            />
          </TabsContent>
        </div>
      </Tabs>
    </SurfaceCard>
  );
}
