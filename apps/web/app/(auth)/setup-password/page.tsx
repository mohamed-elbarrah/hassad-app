import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";
import { AcceptInvitationForm } from "@/components/auth/AcceptInvitationForm";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

export default function SetupPasswordPage() {
  return (
    <AuthPage
      title="إعداد كلمة المرور"
      description="أنشئ كلمة مرور لحسابك للمتابعة"
    >
      <Suspense
        fallback={
          <div className="py-4 text-center text-muted-foreground">
            جارٍ التحميل...
          </div>
        }
      >
        <AcceptInvitationForm />
      </Suspense>
    </AuthPage>
  );
}
