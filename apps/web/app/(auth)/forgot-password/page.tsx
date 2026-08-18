import { AuthPage } from "@/components/auth/AuthPage";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthPage
      title="استعادة كلمة المرور"
      description="أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة التعيين"
    >
      <ForgotPasswordForm />
    </AuthPage>
  );
}
