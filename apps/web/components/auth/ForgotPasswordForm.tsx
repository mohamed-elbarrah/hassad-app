"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { Link } from "@/components/auth/AuthLink";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setSubmitted(true);
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-500 text-right">
          البريد الالكتروني
        </label>
        <div className="relative">
          <input
            type="email"
            placeholder="ادخل البريد الالكتروني هنا"
            required
            className="w-full h-12 px-4 pr-12 text-sm text-secondary-500 bg-white border border-neutral-200 rounded-xl placeholder:text-neutral-200 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors duration-200 text-right"
            disabled={isLoading}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-5 h-5 text-neutral-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>
      </div>

      <AuthButton
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading}
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
