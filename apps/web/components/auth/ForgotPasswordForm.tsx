"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { Link } from "@/components/auth/AuthLink";
import { useForgotPasswordMutation } from "@/features/auth/authApi";
import { authErrorMessage, authSuccessMessage } from "@/lib/i18n";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    try {
      const result = await forgotPassword({ email }).unwrap();
      setSubmitted(true);
      toast.success(authSuccessMessage(result.code));
    } catch (err: unknown) {
      toast.error(authErrorMessage(err));
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-6 py-8 text-center">
        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 aria-hidden="true" className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-primary">تم إرسال الرابط</h2>
          <p className="text-sm text-muted-foreground">
            يرجى التحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور
          </p>
        </div>
        <Link href="/login" className="w-full">
          العودة لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <AuthInput
        id="forgot-password-email"
        label="البريد الالكتروني"
        icon="mail"
        type="email"
        placeholder="ادخل البريد الالكتروني هنا"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
      />

      <AuthButton
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading || !email}
      >
        {isLoading ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
      </AuthButton>

      <div className="flex items-center justify-center">
        <Link href="/login">العودة لتسجيل الدخول</Link>
      </div>

      <AuthFooter
        text="ليس لديك حساب؟"
        buttonText="انشاء حساب"
        href="/signup"
      />
    </form>
  );
}
