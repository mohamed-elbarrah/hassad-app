"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { Link } from "@/components/auth/AuthLink";
import { useForgotPasswordMutation } from "@/features/auth/authApi";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    try {
      await forgotPassword({ email }).unwrap();
      setSubmitted(true);
      toast.success("تم إرسال رابط إعادة التعيين!");
    } catch {
      toast.error("حدث خطأ. يرجى المحاولة لاحقاً.");
    }
  }

  if (submitted) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-success-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-success-500">
            تم إرسال الرابط
          </h2>
          <p className="text-sm text-neutral-300">
            يرجى التحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور
          </p>
        </div>
        <AuthButton
          variant="primary"
          fullWidth
          onClick={() => router.push("/login")}
        >
          العودة لتسجيل الدخول
        </AuthButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthInput
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
