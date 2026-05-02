"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { Link } from "@/components/auth/AuthLink";
import { useResetPasswordMutation } from "@/features/auth/authApi";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      toast.error("رابط غير صالح أو منتهي الصلاحية");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      setSubmitted(true);
      toast.success("تم إعادة تعيين كلمة المرور بنجاح!");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "حدث خطأ. يرجى المحاولة مجدداً.";
      toast.error(message);
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
            تم التعيين بنجاح
          </h2>
          <p className="text-sm text-neutral-300">
            تم إعادة تعيين كلمة المرور. يمكنك الآن تسجيل الدخول.
          </p>
        </div>
        <AuthButton
          variant="primary"
          fullWidth
          onClick={() => router.push("/login")}
        >
          تسجيل الدخول
        </AuthButton>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-danger-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-danger-500">رابط غير صالح</h2>
          <p className="text-sm text-neutral-300">
            الرابط منتهي الصلاحية أو غير صالح. يرجى طلب رابط جديد.
          </p>
        </div>
        <Link href="/forgot-password">طلب رابط جديد</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthInput
        label="كلمة المرور الجديدة"
        type="password"
        showPasswordToggle
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
      />

      <AuthInput
        label="تأكيد كلمة المرور"
        type="password"
        showPasswordToggle
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={isLoading}
      />

      <AuthButton
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading || !password || !confirmPassword}
      >
        {isLoading ? "جارٍ التعيين..." : "إعادة تعيين كلمة المرور"}
      </AuthButton>
    </form>
  );
}
