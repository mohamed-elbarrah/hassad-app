import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthPage
      title="تسجيل الدخول"
      description="من فضلك قم بادخال معلومات لتسجيل الدخول"
    >
      <Suspense
        fallback={
          <div className="py-4 text-center text-muted-foreground">
            جارٍ تحميل النموذج...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthPage>
  );
}
