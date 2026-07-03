"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  KeyRound,
  UserCheck,
  Monitor,
  Shield,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { ActionButton } from "@/components/design-system/ActionButton";
import { UserDetailTabs } from "@/components/dashboard/admin/UserDetailTabs";
import { ImpersonateDialog } from "@/components/dashboard/admin/ImpersonateDialog";
import { ResetPasswordDialog } from "@/components/dashboard/admin/ResetPasswordDialog";
import { toast } from "sonner";
import {
  useGetAdminUserQuery,
  useGetUserActivityQuery,
  useGetAdminSessionsQuery,
  useGetSecurityEventsQuery,
  useResetUserPasswordMutation,
  useImpersonateUserMutation,
  useRevokeUserSessionsMutation,
  useRevokeSessionMutation,
} from "@/features/admin/adminApi";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading } = useGetAdminUserQuery(userId);
  const { data: activity, isLoading: isActivityLoading } = useGetUserActivityQuery({
    id: userId,
    limit: 20,
  });
  const { data: sessionsData, isLoading: isSessionsLoading } = useGetAdminSessionsQuery({
    userId,
  });
  const { data: securityData, isLoading: isSecurityLoading } = useGetSecurityEventsQuery({
    userId,
    limit: 20,
  });

  const [resetPassword] = useResetUserPasswordMutation();
  const [impersonate] = useImpersonateUserMutation();
  const [revokeSessions] = useRevokeUserSessionsMutation();
  const [revokeSession] = useRevokeSessionMutation();

  const [showImpersonate, setShowImpersonate] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId).unwrap();
      toast.success("تم إنهاء الجلسة");
    } catch {
      toast.error("فشل إنهاء الجلسة");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={user?.name ?? "المستخدم"}
        description={user?.email ?? "جاري التحميل..."}
        icon={Shield}
        actions={
          <div className="flex gap-2">
            <ActionButton
              variant="outline"
              size="md"
              onClick={() => router.push("/dashboard/admin/users")}
            >
              <ArrowRight className="size-4 ml-1" />
              العودة
            </ActionButton>
            {user && (
              <>
                <ActionButton
                  variant="outline"
                  size="md"
                  onClick={() => setShowResetPw(true)}
                >
                  <KeyRound className="size-4 ml-1" />
                  إعادة تعيين كلمة المرور
                </ActionButton>
                <ActionButton
                  variant="outline"
                  size="md"
                  onClick={() => setShowImpersonate(true)}
                >
                  <UserCheck className="size-4 ml-1" />
                  الدخول كـ
                </ActionButton>
                <ActionButton
                  variant="outline"
                  size="md"
                  onClick={async () => {
                    try {
                      await revokeSessions(user.id).unwrap();
                      toast.success("تم إنهاء جميع الجلسات");
                    } catch {
                      toast.error("فشل إنهاء الجلسات");
                    }
                  }}
                >
                  <Monitor className="size-4 ml-1" />
                  إنهاء الجلسات
                </ActionButton>
              </>
            )}
          </div>
        }
      />

      <UserDetailTabs
        user={user ?? null}
        isLoading={isLoading}
        activity={activity}
        isActivityLoading={isActivityLoading}
        sessions={sessionsData?.items ?? []}
        isSessionsLoading={isSessionsLoading}
        securityEvents={securityData?.items ?? []}
        isSecurityLoading={isSecurityLoading}
        onRevokeSession={handleRevokeSession}
      />

      {/* Dialogs */}
      {user && (
        <>
          <ImpersonateDialog
            open={showImpersonate}
            onOpenChange={setShowImpersonate}
            userName={user.name}
            onConfirm={async (reason) => {
              const res = await impersonate({ id: user.id, reason }).unwrap();
              return res;
            }}
          />
          <ResetPasswordDialog
            open={showResetPw}
            onOpenChange={setShowResetPw}
            userName={user.name}
            onConfirm={async () => {
              const res = await resetPassword(user.id).unwrap();
              return res;
            }}
          />
        </>
      )}
    </div>
  );
}
