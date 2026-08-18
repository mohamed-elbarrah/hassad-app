import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthPage
      title="إعادة تعيين كلمة المرور"
      description="أدخل كلمة المرور الجديدة أدناه"
    >
      <Suspense
        fallback={
          <div className="py-4 text-center text-muted-foreground">
            جارٍ التحميل...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthPage>
  );
}
