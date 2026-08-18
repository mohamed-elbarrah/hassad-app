import { AuthPage } from "@/components/auth/AuthPage";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthPage
      title="إنشاء حساب جديد"
      description="انضم إلى منصة حصاد وابدأ رحلة نمو نشاطك التجاري"
    >
      <SignupForm />
    </AuthPage>
  );
}
